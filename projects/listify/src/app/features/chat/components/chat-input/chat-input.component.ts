import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-chat-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkTextareaAutosize, MatFormFieldModule, MatInputModule, MatIconButton, MatIcon],
  styles: `
    :host {
      display: block;
      padding: 8px 16px 16px;
    }

    .chat-input-container {
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }

    mat-form-field {
      flex: 1;
    }

    textarea {
      resize: none;
    }
  `,
  template: `
    <div class="chat-input-container">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <textarea
          matInput
          cdkTextareaAutosize
          cdkAutosizeMinRows="1"
          cdkAutosizeMaxRows="5"
          placeholder="Type a message..."
          enterkeyhint="send"
          aria-label="Chat message"
          [value]="messageText()"
          [disabled]="disabled()"
          (input)="onInput($event)"
          (keydown.enter)="onEnter($event)"
        ></textarea>
      </mat-form-field>
      <button
        mat-icon-button
        color="primary"
        aria-label="Send message"
        [disabled]="disabled() || !messageText().trim()"
        (click)="send()"
      >
        <mat-icon>send</mat-icon>
      </button>
    </div>
  `,
})
export class ChatInputComponent {
  readonly disabled = input(false);
  readonly messageSent = output<string>();

  readonly messageText = signal('');

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.messageText.set(textarea.value);
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.messageText().trim();
    if (text) {
      this.messageSent.emit(text);
      this.messageText.set('');
    }
  }
}
