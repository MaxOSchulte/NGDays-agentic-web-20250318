import { computed, inject, Injectable, signal } from '@angular/core';
import { ConfirmChatMessage } from '../models/index';
import { ChatService } from './chat.service';
import { ListService } from './list.service';
import { StorageService } from './storage.service';

const PENDING_KEY = 'listify_pending_confirm';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly storage = inject(StorageService);
  private readonly chatService = inject(ChatService);
  private readonly listService = inject(ListService);

  private readonly _pendingId = signal<string | null>(
    this.storage.load<string | null>(PENDING_KEY, null),
  );
  private readonly _queue: string[] = [];

  readonly pendingId = this._pendingId.asReadonly();
  readonly hasPending = computed(() => this._pendingId() !== null);

  enqueue(msg: ConfirmChatMessage): void {
    if (this._pendingId() === null) {
      this._pendingId.set(msg.id);
      this.persistPending();
    } else {
      this._queue.push(msg.id);
    }
  }

  confirm(messageId: string): void {
    const messages = this.chatService.messages();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.type !== 'confirm') return;

    const confirmMsg = msg as ConfirmChatMessage;

    // Execute the delete
    if (confirmMsg.toolName === 'delete_list') {
      this.listService.deleteList(confirmMsg.args['list_name'] as string);
    } else if (confirmMsg.toolName === 'delete_item') {
      this.listService.deleteItem(
        confirmMsg.args['list_name'] as string,
        confirmMsg.args['item_name'] as string,
      );
    }

    // Update message status
    this.chatService.updateMessage(messageId, {
      status: 'confirmed',
    } as Partial<ConfirmChatMessage>);
    this.advanceQueue();
  }

  cancel(messageId: string): void {
    this.chatService.updateMessage(messageId, {
      status: 'cancelled',
    } as Partial<ConfirmChatMessage>);
    this.advanceQueue();
  }

  private advanceQueue(): void {
    const next = this._queue.shift();
    this._pendingId.set(next ?? null);
    this.persistPending();
  }

  private persistPending(): void {
    const id = this._pendingId();
    if (id) {
      this.storage.save(PENDING_KEY, id);
    } else {
      this.storage.remove(PENDING_KEY);
    }
  }
}
