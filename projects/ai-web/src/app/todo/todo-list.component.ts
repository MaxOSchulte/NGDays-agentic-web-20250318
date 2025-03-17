import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Todo } from './todo.model';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <mat-list>
      @for (todo of todos; track todo.id) {
        <mat-list-item>
          <mat-checkbox
            [checked]="todo.completed"
            (change)="toggle.emit(todo.id)"
            color="primary"
          ></mat-checkbox>
          <span [class.completed]="todo.completed">{{ todo.title }}</span>
          <div matListItemMeta>
            <button mat-icon-button color="warn" (click)="delete.emit(todo.id)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </mat-list-item>
        <mat-divider></mat-divider>
      } @empty {
        <mat-list-item>
          <span matListItemTitle>No todos yet. Add some above!</span>
        </mat-list-item>
      }
    </mat-list>
  `,
  styles: `
    .completed {
      text-decoration: line-through;
      opacity: 0.7;
    }
    mat-list {
      max-height: 400px;
      overflow-y: auto;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.12);
    }
    mat-checkbox {
      margin-right: 16px;
    }
  `,
})
export class TodoListComponent {
  @Input() todos: Todo[] = [];
  @Output() toggle = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
}
