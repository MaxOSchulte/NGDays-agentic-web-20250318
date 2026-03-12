import { inject, Injectable, signal } from '@angular/core';
import { TodoItem, TodoList } from '../models/index';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ListService {
  private readonly storage = inject(StorageService);
  private readonly _lists = signal<TodoList[]>(
    this.storage.load<TodoList[]>(this.storage.LISTS_KEY, []),
  );

  readonly lists = this._lists.asReadonly();

  createList(name: string): TodoList {
    const now = new Date().toISOString();
    const newList: TodoList = {
      name,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    this._lists.update((lists) => [...lists, newList]);
    this.persist();
    return newList;
  }

  getListByName(name: string): TodoList | undefined {
    return this._lists().find((list) => list.name === name);
  }

  renameList(oldName: string, newName: string): void {
    this._lists.update((lists) =>
      lists.map((list) =>
        list.name === oldName
          ? { ...list, name: newName, updatedAt: new Date().toISOString() }
          : list,
      ),
    );
    this.persist();
  }

  deleteList(name: string): void {
    this._lists.update((lists) => lists.filter((list) => list.name !== name));
    this.persist();
  }

  addItem(listName: string, text: string): TodoItem {
    const newItem: TodoItem = {
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this._lists.update((lists) =>
      lists.map((list) =>
        list.name === listName
          ? { ...list, items: [...list.items, newItem], updatedAt: new Date().toISOString() }
          : list,
      ),
    );
    this.persist();
    return newItem;
  }

  toggleItem(listName: string, itemText: string): void {
    this._lists.update((lists) =>
      lists.map((list) =>
        list.name === listName
          ? {
              ...list,
              items: list.items.map((item) =>
                item.text === itemText ? { ...item, completed: !item.completed } : item,
              ),
              updatedAt: new Date().toISOString(),
            }
          : list,
      ),
    );
    this.persist();
  }

  deleteItem(listName: string, itemText: string): void {
    this._lists.update((lists) =>
      lists.map((list) =>
        list.name === listName
          ? {
              ...list,
              items: list.items.filter((item) => item.text !== itemText),
              updatedAt: new Date().toISOString(),
            }
          : list,
      ),
    );
    this.persist();
  }

  private persist(): void {
    this.storage.save(this.storage.LISTS_KEY, this._lists());
  }
}
