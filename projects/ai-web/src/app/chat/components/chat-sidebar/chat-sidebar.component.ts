import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../services/chat.service';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { ChatMessageListComponent } from '../chat-message-list/chat-message-list.component';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    ChatMessageListComponent,
    ChatInputComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <div class="chat-sidebar-container">
      <div class="chat-header">
        <h2>Chat</h2>
        <button
          mat-icon-button
          color="primary"
          (click)="clearChat()"
          aria-label="Clear chat"
          matTooltip="Clear chat"
        >
          <mat-icon>delete_sweep</mat-icon>
        </button>
      </div>

      <app-chat-message-list
        [messages]="chatService.messages()"
      ></app-chat-message-list>

      <app-chat-input (send)="sendMessage($event)"></app-chat-input>
    </div>
  `,
  styleUrl: './chat-sidebar.component.scss',
})
export class ChatSidebarComponent {
  protected chatService = inject(ChatService);

  sendMessage(text: string): void {
    this.chatService.sendMessage(text);
  }

  clearChat(): void {
    this.chatService.clearMessages();
  }
}
