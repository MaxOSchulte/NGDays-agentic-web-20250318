import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { InfoChatMessage, ErrorActionMessage } from '../../../../core/models/index';

@Component({
  selector: 'app-info-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon],
  styles: `
    .info-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 400px;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      line-height: 1.4;
      margin: 4px 0;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      &.info {
        background-color: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
        color: var(--mat-sys-on-surface-variant);

        mat-icon {
          color: var(--mat-sys-primary);
        }
      }

      &.error {
        background-color: color-mix(in srgb, var(--mat-sys-error) 8%, transparent);
        color: var(--mat-sys-on-surface-variant);

        mat-icon {
          color: var(--mat-sys-error);
        }
      }
    }
  `,
  template: `
    <span
      class="info-chip"
      [class.info]="!isError()"
      [class.error]="isError()"
      role="status"
      [attr.aria-label]="message().summary"
    >
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      {{ message().summary }}
    </span>
  `,
})
export class InfoChipComponent {
  readonly message = input.required<InfoChatMessage | ErrorActionMessage>();

  readonly isError = computed(() => this.message().type === 'error-action');
  readonly icon = computed(() => (this.isError() ? 'error_outline' : 'info_outline'));
}
