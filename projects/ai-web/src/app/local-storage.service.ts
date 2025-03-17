import { Injectable } from '@angular/core';
import { DialogMessage } from './chat/models/chat-message.model';
import { TodoList } from './todo/models/todo-list.model';
import { Todo } from './todo/todo.model';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly TODOS_STORAGE_KEY = 'angular_todos';
  private readonly LISTS_STORAGE_KEY = 'angular_todo_lists';
  private readonly CHAT_MESSAGES_STORAGE_KEY = 'angular_chat_messages';

  // Todo Lists methods
  saveTodoLists(lists: TodoList[]): void {
    localStorage.setItem(this.LISTS_STORAGE_KEY, JSON.stringify(lists));
  }

  loadTodoLists(): TodoList[] {
    const data = localStorage.getItem(this.LISTS_STORAGE_KEY);
    if (!data) return [];

    try {
      const lists = JSON.parse(data);
      // Convert string dates back to Date objects
      return lists.map((list: any) => ({
        ...list,
        createdAt: new Date(list.createdAt),
      }));
    } catch (e) {
      console.error('Error parsing todo lists from localStorage', e);
      return [];
    }
  }

  // Todos methods
  saveTodos(todos: Todo[]): void {
    localStorage.setItem(this.TODOS_STORAGE_KEY, JSON.stringify(todos));
  }

  loadTodos(): Todo[] {
    const data = localStorage.getItem(this.TODOS_STORAGE_KEY);
    if (!data) return [];

    try {
      const todos = JSON.parse(data);
      // Convert string dates back to Date objects
      return todos.map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
      }));
    } catch (e) {
      console.error('Error parsing todos from localStorage', e);
      return [];
    }
  }

  // List-specific operations
  getTodosForList(listId: string): Todo[] {
    return this.loadTodos().filter((todo) => todo.listId === listId);
  }

  saveTodosForList(listId: string, todos: Todo[]): void {
    // Get all todos
    const allTodos = this.loadTodos();
    // Filter out todos for the specified list
    const otherTodos = allTodos.filter((todo) => todo.listId !== listId);
    // Combine with the new todos for the list
    const updatedTodos = [...otherTodos, ...todos];

    this.saveTodos(updatedTodos);
  }

  // Chat messages methods
  saveChatMessages(messages: DialogMessage[]): void {
    localStorage.setItem(
      this.CHAT_MESSAGES_STORAGE_KEY,
      JSON.stringify(messages),
    );
  }

  loadChatMessages(): DialogMessage[] {
    const data = localStorage.getItem(this.CHAT_MESSAGES_STORAGE_KEY);
    if (!data) return [];

    try {
      const messages = JSON.parse(data);
      // Convert string dates back to Date objects
      return messages.map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      }));
    } catch (e) {
      console.error('Error parsing chat messages from localStorage', e);
      return [];
    }
  }

  clearChatMessages(): void {
    localStorage.removeItem(this.CHAT_MESSAGES_STORAGE_KEY);
  }
}
