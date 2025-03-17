import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { TodoListStore } from '../stores/todo-list.store';

@Component({
  selector: 'app-todo-list-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
  ],
  template: `
    <div class="create-list-container">
      <mat-toolbar color="primary">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>Create New Todo List</span>
      </mat-toolbar>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="listForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>List Name</mat-label>
              <input
                matInput
                formControlName="name"
                placeholder="My Todo List"
              />
              @if (listForm.controls['name'].hasError('required')) {
              <mat-error> Name is required </mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Description (optional)</mat-label>
              <textarea
                matInput
                formControlName="description"
                placeholder="Add some details about this list"
                rows="3"
              ></textarea>
            </mat-form-field>

            <div class="button-row">
              <button mat-button type="button" (click)="goBack()">
                Cancel
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="listForm.invalid"
              >
                Create List
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .create-list-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
    }
    
    mat-card {
      margin-top: 16px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .button-row {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `,
})
export class TodoListCreateComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private todoListStore = inject(TodoListStore);

  listForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  onSubmit(): void {
    if (this.listForm.valid) {
      const { name, description } = this.listForm.value;
      const listId = this.todoListStore.addList(name, description);
      this.router.navigate(['/lists', listId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/lists']);
  }
}
