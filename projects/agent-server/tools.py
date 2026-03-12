from datetime import datetime, timezone

from ag_ui.core import StateSnapshotEvent
from pydantic_ai import RunContext
from pydantic_ai.ui import StateDeps

from models import ListifyState, TodoItem, TodoList


def _now() -> str:
    """Return current UTC time as ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def _snapshot(state: ListifyState) -> StateSnapshotEvent:
    """Create a StateSnapshotEvent from the current state."""
    return StateSnapshotEvent(snapshot=state.model_dump(by_alias=True))


def _find_list(state: ListifyState, name: str) -> TodoList | None:
    """Find a list by name (exact match)."""
    for lst in state.lists:
        if lst.name == name:
            return lst
    return None


def create_list(ctx: RunContext[StateDeps[ListifyState]], name: str) -> list:
    """Create a new todo list with the given name.

    Args:
        name: The name for the new list.
    """
    now = _now()
    new_list = TodoList(name=name, items=[], createdAt=now, updatedAt=now)
    ctx.deps.state.lists.append(new_list)
    return [
        {"name": name, "items": [], "createdAt": now, "updatedAt": now},
        _snapshot(ctx.deps.state),
    ]


def add_item(
    ctx: RunContext[StateDeps[ListifyState]], list_name: str, text: str
) -> list | dict:
    """Add a new item to a specific list.

    Args:
        list_name: The name of the list to add to.
        text: The text content of the new item.
    """
    lst = _find_list(ctx.deps.state, list_name)
    if lst is None:
        return {"error": f"List '{list_name}' not found"}

    now = _now()
    new_item = TodoItem(text=text, completed=False, createdAt=now)
    lst.items.append(new_item)
    lst.updatedAt = now
    return [
        {"listName": list_name, "text": text, "completed": False, "createdAt": now},
        _snapshot(ctx.deps.state),
    ]


def mark_item_complete(
    ctx: RunContext[StateDeps[ListifyState]], list_name: str, item_name: str
) -> list | dict:
    """Mark a specific item as completed.

    Args:
        list_name: The name of the list containing the item.
        item_name: The text of the item to mark as complete.
    """
    lst = _find_list(ctx.deps.state, list_name)
    if lst is None:
        return {"error": f"List '{list_name}' not found"}

    item_lower = item_name.lower()
    for item in lst.items:
        if item.text.lower() == item_lower:
            item.completed = True
            lst.updatedAt = _now()
            return [
                {
                    "listName": list_name,
                    "itemName": item.text,
                    "completed": True,
                },
                _snapshot(ctx.deps.state),
            ]
    return {"error": f"Item '{item_name}' not found in list '{list_name}'"}


def delete_list(
    ctx: RunContext[StateDeps[ListifyState]], list_name: str
) -> list | dict:
    """Delete an entire todo list.

    Args:
        list_name: The name of the list to delete.
    """
    state = ctx.deps.state
    lst = _find_list(state, list_name)
    if lst is None:
        return {"error": f"List '{list_name}' not found"}

    state.lists = [l for l in state.lists if l.name != list_name]
    return [
        {"listName": list_name, "deleted": True},
        _snapshot(state),
    ]


def delete_item(
    ctx: RunContext[StateDeps[ListifyState]], list_name: str, item_name: str
) -> list | dict:
    """Delete a specific item from a list.

    Args:
        list_name: The name of the list containing the item.
        item_name: The text of the item to delete.
    """
    lst = _find_list(ctx.deps.state, list_name)
    if lst is None:
        return {"error": f"List '{list_name}' not found"}

    item_lower = item_name.lower()
    original_len = len(lst.items)
    lst.items = [item for item in lst.items if item.text.lower() != item_lower]

    if len(lst.items) == original_len:
        return {"error": f"Item '{item_name}' not found in list '{list_name}'"}

    lst.updatedAt = _now()
    return [
        {"listName": list_name, "itemName": item_name, "deleted": True},
        _snapshot(ctx.deps.state),
    ]


def get_list_details(ctx: RunContext[StateDeps[ListifyState]], list_name: str) -> dict:
    """Get full details of a specific list including all its items.

    Args:
        list_name: The name of the list to retrieve.
    """
    state = ctx.deps.state
    for lst in state.lists:
        if lst.name == list_name:
            return {
                "name": lst.name,
                "items": [
                    {
                        "text": item.text,
                        "completed": item.completed,
                        "createdAt": item.createdAt,
                    }
                    for item in lst.items
                ],
                "createdAt": lst.createdAt,
                "updatedAt": lst.updatedAt,
            }
    return {"error": f"List with name '{list_name}' not found"}


def get_all_lists(ctx: RunContext[StateDeps[ListifyState]]) -> list[dict]:
    """Get a summary of all todo lists with item counts.

    Returns a list of summaries, each containing the list name,
    total item count, and completed item count.
    """
    state = ctx.deps.state
    summaries = []
    for lst in state.lists:
        completed = sum(1 for item in lst.items if item.completed)
        summaries.append(
            {
                "name": lst.name,
                "totalItems": len(lst.items),
                "completedItems": completed,
            }
        )
    return summaries


def search_items(ctx: RunContext[StateDeps[ListifyState]], query: str) -> list[dict]:
    """Search for items across all lists by text content (case-insensitive).

    Args:
        query: The search text to match against item text.
    """
    state = ctx.deps.state
    query_lower = query.lower()
    matches = []
    for lst in state.lists:
        for item in lst.items:
            if query_lower in item.text.lower():
                matches.append(
                    {
                        "listName": lst.name,
                        "itemName": item.text,
                        "text": item.text,
                        "completed": item.completed,
                    }
                )
    return matches
