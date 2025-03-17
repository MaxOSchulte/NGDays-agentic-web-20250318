import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ViewChild,
  input,
} from '@angular/core';
import { DialogMessage } from '../../models/chat-message.model';

@Component({
  selector: 'app-chat-message-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="message-list" #scrollContainer>
      @for (message of messages(); track message) {
        <div
          class="message"
          [class.outgoing]="message.role === 'user'"
          [class.incoming]="message.role !== 'user' && message.role !== 'tool'"
          [class.tool]="message.role === 'tool'"
        >
          <div class="message-content">
            <p>{{ message.message }}</p>
            <small class="timestamp">{{
              message.timestamp | date: 'short'
            }}</small>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './chat-message-list.component.scss',
})
export class ChatMessageListComponent implements AfterViewChecked, OnChanges {
  messages = input<DialogMessage[]>([]);
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private previousMessageCount = 0;

  ngAfterViewChecked() {
    // Scroll down after view has been rendered
    this.scrollToBottom();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if messages array has changed and if new messages were added
    if (
      changes['messages'] &&
      this.messages().length > this.previousMessageCount
    ) {
      this.previousMessageCount = this.messages().length;
      // Schedule scrolling for the next tick to ensure view is updated
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  /**
   * Scrolls the message container to the bottom
   */
  private scrollToBottom(): void {
    try {
      const element = this.scrollContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
