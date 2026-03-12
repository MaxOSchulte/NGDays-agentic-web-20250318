import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ChatService } from '../../core/services/chat.service';
import { AgUiService } from '../../core/services/ag-ui.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';
import { MessageListComponent } from './components/message-list/message-list.component';
import { ChatInputComponent } from './components/chat-input/chat-input.component';

@Component({
  selector: 'app-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessageListComponent, ChatInputComponent, MatIconButton, MatIcon],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  protected readonly chatService = inject(ChatService);
  protected readonly confirmationService = inject(ConfirmationService);
  private readonly agUiService = inject(AgUiService);
  private readonly dialog = inject(MatDialog);

  onSend(content: string): void {
    this.agUiService.sendMessage(content);
  }

  onClear(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Clear chat',
        message: 'This will delete all messages and start a fresh conversation.',
        confirmLabel: 'Clear',
      } satisfies ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.agUiService.resetThread();
      }
    });
  }
}
