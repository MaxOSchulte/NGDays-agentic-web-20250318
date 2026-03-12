from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TodoItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str
    completed: bool
    createdAt: str


class TodoList(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    items: list[TodoItem] = []
    createdAt: str
    updatedAt: str


class ListifyState(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lists: list[TodoList] = []
    current_screen: str = Field(default="chat", alias="currentScreen")
    current_list_name: str | None = Field(default=None, alias="currentListName")
