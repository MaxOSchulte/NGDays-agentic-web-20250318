import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from pydantic_ai.ui import StateDeps
from pydantic_ai.ui.ag_ui import AGUIAdapter
from starlette.requests import Request
from starlette.responses import Response

from agent import listify_agent
from config import FRONTEND_ORIGIN
from models import ListifyState

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Listify Agent Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


def _build_instructions(state: ListifyState) -> str:
    """Build factual system prompt from current AG-UI state.

    This provides raw state data (current screen, lists, items) — NOT behavioral
    guidance.  The agent's own @instructions decorator in agent.py handles that.
    """
    parts: list[str] = []

    # 1. Navigation context
    screen = state.current_screen
    if screen == "list-detail" and state.current_list_name:
        current = next(
            (lst for lst in state.lists if lst.name == state.current_list_name), None
        )
        if current:
            completed = sum(1 for item in current.items if item.completed)
            total = len(current.items)
            detail = f"The user is viewing list '{current.name}'."
            if total > 0:
                detail += f" {completed}/{total} items completed."
            parts.append(detail)
        else:
            parts.append(
                "The user is viewing a list that is no longer available."
            )
    elif screen == "all-lists":
        parts.append("The user is viewing the all-lists overview.")
    else:
        parts.append("The user is on the chat screen.")

    # 2. Data summary
    if not state.lists:
        parts.append("The user has no lists.")
    else:
        lines = [f"The user has {len(state.lists)} list(s):"]
        for lst in state.lists:
            completed = sum(1 for item in lst.items if item.completed)
            lines.append(
                f"- '{lst.name}': {len(lst.items)} items, {completed} completed"
            )
        parts.append("\n".join(lines))

    # 3. Active list detail (list-detail screen only)
    if screen == "list-detail" and state.current_list_name:
        current = next(
            (lst for lst in state.lists if lst.name == state.current_list_name), None
        )
        if current:
            if current.items:
                item_lines = [f"Items in '{current.name}':"]
                for item in current.items:
                    mark = "x" if item.completed else " "
                    item_lines.append(f"- [{mark}] {item.text}")
                parts.append("\n".join(item_lines))
            else:
                parts.append("This list has no items.")

    return "\n\n".join(parts)


def _parse_state(body: dict) -> ListifyState:
    """Parse the AG-UI state field from the request body into ListifyState."""
    raw_state = body.get("state")
    if not raw_state:
        return ListifyState()
    try:
        return ListifyState.model_validate(raw_state)
    except ValidationError:
        logger.warning(
            "Failed to parse ListifyState from request body, using empty state"
        )
        return ListifyState()


@app.post("/agui")
async def agui_endpoint(request: Request) -> Response:
    body = await request.json()
    state = _parse_state(body)
    logger.info("Received AG-UI request with %d list(s)", len(state.lists))
    return await AGUIAdapter.dispatch_request(
        request, agent=listify_agent, deps=StateDeps(state=state),
        instructions=_build_instructions(state),
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
