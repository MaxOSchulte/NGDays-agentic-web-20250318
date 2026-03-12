import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { ActionChatMessage } from '../../../../core/models/index';

@Component({
  selector: 'app-action-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatIcon],
  styleUrl: './action-card.component.scss',
  template: `
    <mat-card
      appearance="outlined"
      class="action-card"
      [class.tappable]="message().listName"
      role="status"
      [tabIndex]="message().listName ? 0 : -1"
      [attr.aria-label]="message().summary"
      (click)="navigateIfTappable()"
      (keydown.enter)="navigateIfTappable()"
    >
      <div class="action-card-content">
        <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
        <span class="action-summary">
          {{ message().summary }}
          @if (message().count && message().count! > 1) {
            <span class="action-count">({{ message().count }} items)</span>
          }
        </span>
      </div>
    </mat-card>
  `,
})
export class ActionCardComponent {
  readonly message = input.required<ActionChatMessage>();
  private readonly router = inject(Router);

  readonly icon = computed(() => {
    switch (this.message().toolName) {
      case 'create_list':
        return 'playlist_add';
      case 'add_item':
        return 'add_task';
      case 'mark_item_complete':
        return 'task_alt';
      default:
        return 'check_circle';
    }
  });

  navigateIfTappable(): void {
    const listName = this.message().listName;
    if (listName) {
      this.router.navigate(['/tasks', encodeURIComponent(listName)]);
    }
  }
}
