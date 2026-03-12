import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TextChatMessage } from '../../../../core/models/index';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-message-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownPipe, MatIcon],
  styleUrl: './message-bubble.component.scss',
  template: `
    <div [class]="'message-bubble ' + message().role">
      @if (message().role === 'user') {
        <span class="message-text">{{ message().content }}</span>
      } @else {
        <div class="message-text" [innerHTML]="message().content | markdown"></div>
      }
      @if (message().status === 'error') {
        <mat-icon class="error-icon" aria-hidden="true">warning</mat-icon>
      }
    </div>
  `,
})
export class MessageBubbleComponent {
  readonly message = input.required<TextChatMessage>();
}
