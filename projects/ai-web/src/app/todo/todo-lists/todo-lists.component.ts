import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { AiClickDirective } from '../../../../../ai-tooling/src/public-api';
import { TodoListStore } from '../stores/todo-list.store';

@Component({
  selector: 'app-todo-lists',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,
    AiClickDirective,
  ],
  template: `
    <div class="todo-lists-container">
      <mat-toolbar color="primary">
        <span>Todo Lists</span>
        <span class="spacer"></span>
        <button
          mat-mini-fab
          color="accent"
          [routerLink]="['/lists/new']"
          matTooltip="Add new list"
        >
          <mat-icon>add</mat-icon>
        </button>
      </mat-toolbar>

      <div class="lists-grid">
        <mat-card
          *ngFor="let list of todoListStore.lists()"
          class="list-card"
          (click)="navigateToList(list.id)"
        >
          <mat-card-header>
            <mat-card-title>{{ list.name }}</mat-card-title>
            <mat-card-subtitle
              >Created: {{ list.createdAt | date: 'medium' }}</mat-card-subtitle
            >
          </mat-card-header>
          <mat-card-content *ngIf="list.description">
            <p>{{ list.description }}</p>
          </mat-card-content>
          <mat-card-actions align="end">
            <button
              mat-icon-button
              color="warn"
              [aitClick]="
                'Delete list with ID: ' + list.id + ', and title: ' + list.name
              "
              (click)="deleteList($event, list.id)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card
          *ngIf="todoListStore.lists().length === 0"
          class="empty-state-card"
        >
          <mat-card-content>
            <p class="empty-message">
              No todo lists found. Create your first list!
            </p>
            <button
              mat-raised-button
              color="primary"
              [routerLink]="['/lists/new']"
            >
              Create New List
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: `
    .todo-lists-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .lists-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .list-card {
      cursor: pointer;
      transition:
        transform 0.2s ease-in-out,
        box-shadow 0.2s ease-in-out;
    }

    .list-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .empty-state-card {
      grid-column: 1 / -1;
      text-align: center;
      padding: 32px;
    }

    .empty-message {
      margin-bottom: 16px;
      font-size: 18px;
      color: #666;
    }
  `,
})
export class TodoListsComponent implements OnInit {
  todoListStore = inject(TodoListStore);
  router = inject(Router);

  ngOnInit(): void {
    // Nothing to initialize
  }

  navigateToList(listId: string): void {
    this.router.navigate(['/lists', listId]);
  }

  deleteList(event: Event, listId: string): void {
    event.stopPropagation(); // Prevent navigation to the list
    this.todoListStore.deleteList(listId);
  }
}
