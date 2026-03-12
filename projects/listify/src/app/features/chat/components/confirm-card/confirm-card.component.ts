import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmChatMessage } from '../../../../core/models/index';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

@Component({
  selector: 'app-confirm-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatIcon, MatButtonModule],
  styleUrl: './confirm-card.component.scss',
  template: `
    <mat-card
      appearance="outlined"
      class="confirm-card"
      [class.resolved]="!isPending()"
      role="alertdialog"
      [attr.aria-label]="'Confirm: ' + message().summary"
    >
      <div class="confirm-card-content">
        <mat-icon class="warning-icon" aria-hidden="true">warning</mat-icon>
        <span class="confirm-summary">{{ message().summary }}</span>
      </div>
      @if (isPending()) {
        <div class="confirm-actions">
          <button mat-button (click)="onCancel()">Cancel</button>
          <button mat-flat-button color="warn" (click)="onConfirm()">Confirm</button>
        </div>
      } @else {
        <span class="confirm-result">{{ resultText() }}</span>
      }
    </mat-card>
  `,
})
export class ConfirmCardComponent {
  readonly message = input.required<ConfirmChatMessage>();
  private readonly confirmationService = inject(ConfirmationService);

  readonly isPending = computed(() => this.message().status === 'pending');

  readonly resultText = computed(() => {
    const status = this.message().status;
    if (status === 'confirmed') return 'Deleted \u2713';
    if (status === 'cancelled') return 'Cancelled';
    return '';
  });

  onConfirm(): void {
    this.confirmationService.confirm(this.message().id);
  }

  onCancel(): void {
    this.confirmationService.cancel(this.message().id);
  }
}
