import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-thinking-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .thinking-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 12px 16px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--mat-sys-primary);
      animation: bounce 1.4s ease-in-out infinite;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }

    @keyframes bounce {
      0%,
      60%,
      100% {
        transform: translateY(0);
        opacity: 0.4;
      }

      30% {
        transform: translateY(-6px);
        opacity: 1;
      }
    }
  `,
  template: `
    <div class="thinking-indicator" role="status" aria-label="AI is thinking">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `,
})
export class ThinkingIndicatorComponent {}
