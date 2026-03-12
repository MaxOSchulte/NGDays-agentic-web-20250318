import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ChatService } from '../../../../core/services/chat.service';
import { AgUiService } from '../../../../core/services/ag-ui.service';
import { ListService } from '../../../../core/services/list.service';
import {
  TextChatMessage,
  ActionChatMessage,
  ConfirmChatMessage,
  InfoChatMessage,
  ErrorActionMessage,
  PreviewChatMessage,
} from '../../../../core/models/index';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { ThinkingIndicatorComponent } from '../thinking-indicator/thinking-indicator.component';
import { ActionCardComponent } from '../action-card/action-card.component';
import { ConfirmCardComponent } from '../confirm-card/confirm-card.component';
import { InfoChipComponent } from '../info-chip/info-chip.component';
import { PreviewCardComponent } from '../preview-card/preview-card.component';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-message-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MessageBubbleComponent,
    ThinkingIndicatorComponent,
    ActionCardComponent,
    ConfirmCardComponent,
    InfoChipComponent,
    PreviewCardComponent,
    MarkdownPipe,
    MatButtonModule,
  ],
  styleUrl: './message-list.component.scss',
  template: `
    <div class="message-list" #messageContainer (scroll)="onScroll()">
      @if (!chatService.hasMessages() && !chatService.isProcessing()) {
        <div class="empty-state">
          <p>Start a conversation with your AI assistant</p>
        </div>
      }
      @for (message of chatService.messages(); track message.id) {
        @switch (message.type) {
          @case ('chat') {
            <app-message-bubble [message]="$any(message)" />
          }
          @case ('action') {
            <div class="action-card-wrapper">
              <app-action-card [message]="$any(message)" />
            </div>
          }
          @case ('confirm') {
            <div class="confirm-card-wrapper">
              <app-confirm-card [message]="$any(message)" />
            </div>
          }
          @case ('info') {
            <div class="info-chip-wrapper">
              <app-info-chip [message]="$any(message)" />
            </div>
          }
          @case ('error-action') {
            <div class="info-chip-wrapper">
              <app-info-chip [message]="$any(message)" />
            </div>
          }
          @case ('preview') {
            <div class="preview-card-wrapper">
              <app-preview-card [message]="$any(message)" />
            </div>
          }
        }
      }
      @if (chatService.isProcessing()) {
        <div class="assistant-streaming">
          @if (!chatService.streamingText()) {
            <app-thinking-indicator />
          }
          @if (chatService.streamingText(); as text) {
            <div
              class="streaming-content message-bubble assistant"
              [innerHTML]="text | markdown"
            ></div>
          }
        </div>
      }
      @if (chatService.error(); as error) {
        <div class="error-message" role="alert">
          <span>{{ error.message }}</span>
          @if (error.retryContent) {
            <button mat-button color="warn" (click)="onRetry()" aria-label="Retry sending message">
              Retry
            </button>
          }
        </div>
      }
    </div>
    <!-- Screen reader live region for new messages -->
    <div class="cdk-visually-hidden" aria-live="polite" aria-atomic="true">
      @if (latestAnnouncement(); as announcement) {
        {{ announcement }}
      }
    </div>
  `,
})
export class MessageListComponent {
  protected readonly chatService = inject(ChatService);
  private readonly agUiService = inject(AgUiService);
  private readonly listService = inject(ListService);

  private readonly messageContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('messageContainer');
  private userScrolledUp = false;

  /** Announces the latest message to screen readers, covering all message types */
  readonly latestAnnouncement = computed<string | null>(() => {
    const messages = this.chatService.messages();
    if (messages.length === 0) return null;

    const last = messages[messages.length - 1];
    switch (last.type) {
      case 'chat': {
        const textMsg = last as TextChatMessage;
        return textMsg.role === 'assistant' ? textMsg.content : null;
      }
      case 'action':
        return (last as ActionChatMessage).summary;
      case 'preview': {
        const previewMsg = last as PreviewChatMessage;
        const list = this.listService.getListByName(previewMsg.listName);
        return list ? `List preview: ${list.name}` : 'List preview';
      }
      case 'confirm':
        return `Confirmation needed: ${(last as ConfirmChatMessage).summary}`;
      case 'info':
        return (last as InfoChatMessage).summary;
      case 'error-action':
        return `Error: ${(last as ErrorActionMessage).summary}`;
      default:
        return null;
    }
  });

  constructor() {
    effect(() => {
      // Track reactive dependencies
      this.chatService.streamingText();
      this.chatService.messages();

      this.scrollToBottomIfNeeded();
    });
  }

  onScroll(): void {
    const el = this.messageContainer().nativeElement;
    const threshold = 50;
    this.userScrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
  }

  onRetry(): void {
    this.agUiService.retry();
  }

  private scrollToBottomIfNeeded(): void {
    if (this.userScrolledUp) {
      return;
    }
    requestAnimationFrame(() => {
      const el = this.messageContainer().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}
