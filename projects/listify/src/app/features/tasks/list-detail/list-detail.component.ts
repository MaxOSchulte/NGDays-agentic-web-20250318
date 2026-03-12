import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ListService } from '../../../core/services/list.service';
import { TodoItem } from '../../../core/models/index';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-list-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatListModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './list-detail.component.html',
  styleUrl: './list-detail.component.scss',
})
export class ListDetailComponent {
  readonly listName = input<string>();

  protected readonly listService = inject(ListService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  protected readonly list = computed(() => this.listService.getListByName(this.listName() ?? ''));
  protected readonly newItemText = signal('');

  addItem(): void {
    const name = this.listName();
    if (!name) return;

    const text = this.newItemText().trim();
    if (text) {
      this.listService.addItem(name, text);
      this.newItemText.set('');
    }
  }

  toggleItem(itemText: string): void {
    const name = this.listName();
    if (!name) return;
    this.listService.toggleItem(name, itemText);
  }

  confirmDeleteItem(item: TodoItem): void {
    const name = this.listName();
    if (!name) return;

    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete Item',
          message: `Delete "${item.text}"?`,
        },
      },
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.listService.deleteItem(name, item.text);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
