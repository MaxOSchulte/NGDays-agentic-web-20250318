import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
    title: 'AI Chat',
  },
  {
    path: 'tasks/:listName',
    loadComponent: () =>
      import('./features/tasks/list-detail/list-detail.component').then(
        (m) => m.ListDetailComponent,
      ),
    title: 'List',
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/tasks.component').then((m) => m.TasksComponent),
    title: 'All Lists',
  },
];
