import { computed, Injectable, signal } from '@angular/core';
import { LocalStorageService } from '../local-storage.service';
import { Todo } from './todo.model';

@Injectable()
export class TodoStore {
  private listId!: string; // Using ! to tell TypeScript that this will be initialized before use

  state = signal<{
    todos: Todo[];
    filter: 'all' | 'active' | 'completed';
  }>({
    todos: [],
    filter: 'all',
  });

  // Computed values
  filteredTodos = computed(() => {
    const { todos, filter } = this.state();
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  });

  stats = computed(() => {
    const todos = this.state().todos;
    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      active: todos.filter((t) => !t.completed).length,
    };
  });

  constructor(private storage: LocalStorageService) {}

  // Initialize store with a specific list ID
  initializeForList(listId: string) {
    this.listId = listId;
    const listTodos = this.storage.getTodosForList(listId);

    this.state.update((current) => ({
      ...current,
      todos: listTodos,
    }));
  }

  // Actions
  addTodo(title: string) {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      listId: this.listId,
      title,
      completed: false,
      createdAt: new Date(),
    };

    this.state.update((current) => ({
      ...current,
      todos: [...current.todos, newTodo],
    }));

    this.saveToStorage();
  }

  toggleTodo(id: string) {
    this.state.update((current) => ({
      ...current,
      todos: current.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));

    this.saveToStorage();
  }

  updateTodo(id: string, title: string) {
    this.state.update((current) => ({
      ...current,
      todos: current.todos.map((todo) =>
        todo.id === id ? { ...todo, title } : todo
      ),
    }));

    this.saveToStorage();
  }

  deleteTodo(id: string) {
    this.state.update((current) => ({
      ...current,
      todos: current.todos.filter((todo) => todo.id !== id),
    }));

    this.saveToStorage();
  }

  setFilter(filter: 'all' | 'active' | 'completed') {
    this.state.update((current) => ({ ...current, filter }));
  }

  private saveToStorage() {
    this.storage.saveTodosForList(this.listId, this.state().todos);
  }
}
