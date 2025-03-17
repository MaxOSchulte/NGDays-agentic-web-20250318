import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="chat-input-container">
      <mat-form-field appearance="outline" class="chat-input-field">
        <textarea
          matInput
          [formControl]="messageInput"
          placeholder="Type a message..."
          (keydown.control.enter)="sendMessage()"
          (keydown.meta.enter)="sendMessage()"
        ></textarea>
        <mat-hint>Press Ctrl+Enter or ⌘+Enter to send</mat-hint>
      </mat-form-field>
      <button
        mat-fab
        color="primary"
        class="send-button"
        (click)="sendMessage()"
        [disabled]="!messageInput.value"
        aria-label="Send message"
      >
        <mat-icon>send</mat-icon>
      </button>
    </div>
  `,
  styleUrl: './chat-input.component.scss',
})
export class ChatInputComponent {
  messageInput = new FormControl('');
  @Output() send = new EventEmitter<string>();

  sendMessage(): void {
    if (this.messageInput.value?.trim()) {
      this.send.emit(this.messageInput.value);
      this.messageInput.setValue('');
    }
  }
}
