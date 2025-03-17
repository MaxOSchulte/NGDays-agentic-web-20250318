import { Routes } from '@angular/router';
import { TodoContainerComponent } from './todo/todo-container.component';
import { TodoListCreateComponent } from './todo/todo-lists/todo-list-create.component';
import { TodoListsComponent } from './todo/todo-lists/todo-lists.component';

export const routes: Routes = [
  { path: '', redirectTo: '/lists', pathMatch: 'full' },
  { path: 'lists', component: TodoListsComponent },
  { path: 'lists/new', component: TodoListCreateComponent },
  { path: 'lists/:id', component: TodoContainerComponent },
  { path: '**', redirectTo: '/lists' }, // Fallback for 404
];
