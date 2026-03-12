import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ListService } from '../../core/services/list.service';
import { TodoList } from '../../core/models/index';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-tasks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent {
  protected readonly listService = inject(ListService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly editingListName = signal<string | null>(null);
  readonly editName = signal('');
  readonly newListName = signal('');

  createList(): void {
    const name = this.newListName().trim();
    if (name) {
      this.listService.createList(name);
      this.newListName.set('');
    }
  }

  startEdit(list: TodoList): void {
    this.editingListName.set(list.name);
    this.editName.set(list.name);
  }

  saveEdit(listName: string): void {
    const name = this.editName().trim();
    if (name) {
      this.listService.renameList(listName, name);
      this.editingListName.set(null);
    }
  }

  cancelEdit(): void {
    this.editingListName.set(null);
  }

  confirmDelete(list: TodoList): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete List',
          message: `Delete '${list.name}' and all its items? This cannot be undone.`,
        },
      },
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.listService.deleteList(list.name);
      }
    });
  }

  openList(listName: string): void {
    this.router.navigate(['/tasks', encodeURIComponent(listName)]);
  }
}
