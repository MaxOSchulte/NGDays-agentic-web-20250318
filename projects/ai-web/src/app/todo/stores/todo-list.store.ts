import { computed, Injectable, signal } from '@angular/core';
import { LocalStorageService } from '../../local-storage.service';
import { TodoList } from '../models/todo-list.model';
import { TodoStore } from '../todo.store';

@Injectable({
  providedIn: 'root',
})
export class TodoListStore {
  // State containing all todo lists
  private state = signal<{
    lists: TodoList[];
  }>({
    lists: [],
  });

  // Computed values
  lists = computed(() => this.state().lists);

  constructor(private storage: LocalStorageService) {
    // Load the lists from storage on initialization
    const savedLists = this.storage.loadTodoLists();
    if (savedLists.length > 0) {
      this.state.update((current) => ({
        ...current,
        lists: savedLists,
      }));
    } else {
      // Create some initial demo lists if there are none
      this.createDemoLists();
    }
  }

  private createDemoLists(): void {
    // Add some demo lists
    const workList = this.addList('Work Tasks', 'Tasks related to my job');
    const homeList = this.addList(
      'Home Tasks',
      'Household chores and personal tasks',
    );
    const shoppingList = this.addList('Shopping List', 'Items to buy');

    // Get the TodoStore to add some initial todos
    const todoStore = new TodoStore(this.storage);

    // Add demo todos to Work list
    todoStore.initializeForList(workList);
    todoStore.addTodo('Finish project report');
    todoStore.addTodo('Schedule team meeting');
    todoStore.addTodo('Respond to emails');

    // Add demo todos to Home list
    todoStore.initializeForList(homeList);
    todoStore.addTodo('Clean the kitchen');
    todoStore.addTodo('Do laundry');
    todoStore.addTodo('Pay bills');

    // Add demo todos to Shopping list
    todoStore.initializeForList(shoppingList);
    todoStore.addTodo('Milk');
    todoStore.addTodo('Bread');
    todoStore.addTodo('Eggs');
  }

  // Actions
  addList(name: string, description?: string): string {
    const newList: TodoList = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date(),
    };

    this.state.update((current) => ({
      ...current,
      lists: [...current.lists, newList],
    }));

    this.saveToStorage();
    return newList.id; // Return the ID of the new list
  }

  updateList(id: string, data: Partial<TodoList>): void {
    this.state.update((current) => ({
      ...current,
      lists: current.lists.map((list) =>
        list.id === id ? { ...list, ...data } : list,
      ),
    }));

    this.saveToStorage();
  }

  deleteList(id: string): void {
    this.state.update((current) => ({
      ...current,
      lists: current.lists.filter((list) => list.id !== id),
    }));

    this.saveToStorage();
  }

  getList(id: string): TodoList | undefined {
    return this.state().lists.find((list) => list.id === id);
  }

  private saveToStorage(): void {
    this.storage.saveTodoLists(this.state().lists);
  }
}
