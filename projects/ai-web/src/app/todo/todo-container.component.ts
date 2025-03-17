import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { TodoListStore } from './stores/todo-list.store';
import { TodoFilterComponent } from './todo-filter.component';
import { TodoFormComponent } from './todo-form.component';
import { TodoListComponent } from './todo-list.component';
import { TodoStore } from './todo.store';

@Component({
  selector: 'app-todo-container',
  standalone: true,
  imports: [
    TodoFormComponent,
    TodoListComponent,
    TodoFilterComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatChipsModule,
  ],
  template: `
    <div class="todo-container">
      <mat-toolbar color="primary">
        <button mat-icon-button (click)="navigateToLists()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>{{ listName }}</span>
        <span class="spacer"></span>
      </mat-toolbar>

      <mat-card>
        <mat-card-content>
          <app-todo-form (addTodo)="store.addTodo($event)" />

          <app-todo-filter
            [currentFilter]="store.state().filter"
            (filterChange)="store.setFilter($event)"
          />

          <app-todo-list
            [todos]="store.filteredTodos()"
            (toggle)="store.toggleTodo($event)"
            (delete)="store.deleteTodo($event)"
          />

          <div class="stats">
            <mat-chip-set>
              <mat-chip>Total: {{ store.stats().total }}</mat-chip>
              <mat-chip>Active: {{ store.stats().active }}</mat-chip>
              <mat-chip>Completed: {{ store.stats().completed }}</mat-chip>
            </mat-chip-set>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .todo-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    mat-card {
      margin-top: 16px;
    }
    
    .stats {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
  `,
  providers: [TodoStore],
})
export class TodoContainerComponent implements OnInit {
  store = inject(TodoStore);
  route = inject(ActivatedRoute);
  router = inject(Router);
  todoListStore = inject(TodoListStore);

  listId!: string;
  listName = 'Todo List';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/lists']);
        return;
      }

      this.listId = id;

      // Initialize TodoStore with the list ID
      this.store.initializeForList(this.listId);

      // Get list details
      const list = this.todoListStore.getList(this.listId);
      if (list) {
        this.listName = list.name;
      } else {
        // If list doesn't exist, go back to lists page
        this.router.navigate(['/lists']);
      }
    });
  }

  navigateToLists(): void {
    this.router.navigate(['/lists']);
  }
}
