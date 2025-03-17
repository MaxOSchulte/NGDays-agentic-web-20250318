import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-todo-form',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <form (submit)="onSubmit()" class="todo-form">
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Add new todo</mat-label>
        <input
          matInput
          [(ngModel)]="newTodoTitle"
          name="newTodo"
          placeholder="What needs to be done?"
        />
      </mat-form-field>
      <button
        mat-raised-button
        color="primary"
        type="submit"
        [disabled]="!newTodoTitle.trim()"
      >
        <mat-icon>add</mat-icon>
        Add
      </button>
    </form>
  `,
  styles: `
    .todo-form {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: center;
    }
    
    .form-field {
      flex-grow: 1;
    }
  `,
})
export class TodoFormComponent {
  newTodoTitle = '';
  @Output() addTodo = new EventEmitter<string>();

  onSubmit() {
    if (this.newTodoTitle.trim()) {
      this.addTodo.emit(this.newTodoTitle.trim());
      this.newTodoTitle = '';
    }
  }
}
