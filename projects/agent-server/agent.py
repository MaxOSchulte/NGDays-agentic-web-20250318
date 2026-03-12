from pydantic_ai import Agent, RunContext
from pydantic_ai.ui import StateDeps

from models import ListifyState
from tools import (
    add_item,
    create_list,
    delete_item,
    delete_list,
    get_all_lists,
    get_list_details,
    mark_item_complete,
    search_items,
)

listify_agent = Agent(
    "anthropic:claude-sonnet-4-6",
    deps_type=StateDeps[ListifyState],
    instructions=(
        "You are Listify, a helpful assistant for managing todo lists. "
        "You help users create, organize, and manage their todo lists and items. "
        "Be concise and helpful. Confirm actions after completing them. "
        "If the user's request is ambiguous about which list to modify, ask for clarification. "
        "Keep responses brief - one or two sentences for simple actions."
    ),
    tools=[
        create_list,
        add_item,
        mark_item_complete,
        delete_list,
        delete_item,
        get_list_details,
        get_all_lists,
        search_items,
    ],
)


@listify_agent.instructions
def add_list_context(ctx: RunContext[StateDeps[ListifyState]]) -> str:
    """Inject view context and list summary into system prompt."""
    state = ctx.deps.state
    parts = []

    # View context
    screen = state.current_screen
    if screen == "list-detail" and state.current_list_name:
        current = next(
            (lst for lst in state.lists if lst.name == state.current_list_name), None
        )
        if current:
            completed = sum(1 for item in current.items if item.completed)
            parts.append(
                f"User is currently viewing list '{current.name}' "
                f"({completed}/{len(current.items)} items completed). "
                "When the user refers to items or the list without specifying a name, "
                "they mean this list. Act on it directly without asking for clarification."
            )
            if not current.items:
                parts.append(
                    "This list is empty. Consider suggesting items to add."
                )
            elif all(item.completed for item in current.items):
                parts.append("All items in this list are complete.")
        else:
            parts.append("User is viewing a list that no longer exists.")
    elif screen == "all-lists":
        parts.append(
            "User is viewing the all-lists overview. "
            "They can see all their lists but aren't focused on a specific one. "
            "If they want to act on a specific list, ask which one."
        )
    else:
        parts.append(
            "User is in the chat tab. No specific list is in view. "
            "If they reference a list by name, find it using your tools. "
            "If the request is ambiguous about which list, ask for clarification."
        )

    # Global data summary
    if not state.lists:
        parts.append("The user currently has no lists.")
    else:
        summaries = []
        for lst in state.lists:
            completed = sum(1 for item in lst.items if item.completed)
            summaries.append(
                f"- '{lst.name}': {len(lst.items)} items ({completed} completed)"
            )
        parts.append("All lists:\n" + "\n".join(summaries))

    # Fetch tool guidance
    parts.append(
        "Use get_all_lists to see what lists exist. "
        "Use get_list_details to see items in a specific list. "
        "Use search_items to find items across lists."
    )

    return "\n\n".join(parts)
