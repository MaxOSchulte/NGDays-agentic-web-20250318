import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { PreviewChatMessage } from '../../../../core/models/index';
import { ListService } from '../../../../core/services/list.service';

const INITIAL_ITEMS = 5;

@Component({
  selector: 'app-preview-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatIcon, MatCheckbox, MatProgressBar, JsonPipe],
  styleUrl: './preview-card.component.scss',
  template: `
    @if (isDeleted()) {
      <mat-card
        appearance="outlined"
        class="preview-card deleted"
        role="region"
        aria-label="Deleted list"
      >
        <div class="deleted-content">
          <mat-icon aria-hidden="true">delete_outline</mat-icon>
          <span>This list was deleted {{ message() | json }}</span>
        </div>
      </mat-card>
    } @else if (list(); as currentList) {
      <mat-card
        appearance="outlined"
        class="preview-card"
        role="region"
        [attr.aria-label]="'List preview: ' + currentList.name"
      >
        <div class="preview-header">
          <div class="header-row">
            <span class="list-name">{{ currentList.name }}</span>
            <span class="progress-count"
              >{{ completedCount() }} / {{ currentList.items.length }}</span
            >
          </div>
          <mat-progress-bar
            mode="determinate"
            [value]="progressPercent()"
            [attr.aria-label]="
              completedCount() + ' of ' + currentList.items.length + ' items completed'
            "
          />
        </div>
        <div class="preview-items">
          @for (item of visibleItems(); track item.text) {
            <div class="preview-item" [class.completed]="item.completed">
              <mat-checkbox
                [checked]="item.completed"
                (change)="toggleItem(item.text)"
                [attr.aria-label]="
                  item.text + (item.completed ? ' (completed)' : ' (not completed)')
                "
              >
                {{ item.text }}
              </mat-checkbox>
            </div>
          }
        </div>
        @if (hasOverflow()) {
          <button
            class="expand-toggle"
            type="button"
            (click)="toggleExpand()"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="
              expanded() ? 'Show fewer items' : 'Show all ' + currentList.items.length + ' items'
            "
          >
            @if (expanded()) {
              Show fewer
            } @else {
              Show all {{ currentList.items.length }} items
            }
          </button>
        }
        <button
          class="open-list-btn"
          type="button"
          (click)="navigateToList()"
          [attr.aria-label]="'Open ' + currentList.name"
        >
          <mat-icon aria-hidden="true">open_in_new</mat-icon>
          Open list
        </button>
      </mat-card>
    }
  `,
})
export class PreviewCardComponent {
  readonly message = input.required<PreviewChatMessage>();
  private readonly listService = inject(ListService);
  private readonly router = inject(Router);

  readonly list = computed(() => this.listService.getListByName(this.message().listName));
  readonly isDeleted = computed(() => !this.list());

  readonly completedCount = computed(() => {
    const currentList = this.list();
    if (!currentList) return 0;
    return currentList.items.filter((i) => i.completed).length;
  });

  readonly progressPercent = computed(() => {
    const currentList = this.list();
    if (!currentList || currentList.items.length === 0) return 0;
    return (this.completedCount() / currentList.items.length) * 100;
  });

  readonly expanded = signal(false);

  readonly visibleItems = computed(() => {
    const currentList = this.list();
    if (!currentList) return [];
    return this.expanded() ? currentList.items : currentList.items.slice(0, INITIAL_ITEMS);
  });

  readonly hasOverflow = computed(() => {
    const currentList = this.list();
    if (!currentList) return false;
    return currentList.items.length > INITIAL_ITEMS;
  });

  toggleItem(itemText: string): void {
    this.listService.toggleItem(this.message().listName, itemText);
  }

  toggleExpand(): void {
    this.expanded.update((v) => !v);
  }

  navigateToList(): void {
    this.router.navigate(['/tasks', encodeURIComponent(this.message().listName)]);
  }
}
