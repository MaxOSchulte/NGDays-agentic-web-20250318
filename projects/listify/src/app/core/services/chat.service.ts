import { computed, inject, Injectable, signal } from '@angular/core';
import {
  ActionChatMessage,
  ChatError,
  ChatMessage,
  ConfirmChatMessage,
  ErrorActionMessage,
  InfoChatMessage,
  PreviewChatMessage,
  TextChatMessage,
} from '../models/index';
import { StorageService } from './storage.service';

const MAX_MESSAGES = 200;

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly storage = inject(StorageService);

  private readonly _messages = signal<ChatMessage[]>(this.hydrateMessages());
  private readonly _streamingText = signal('');
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<ChatError | null>(null);

  readonly messages = this._messages.asReadonly();
  readonly streamingText = this._streamingText.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();

  readonly hasMessages = computed(() => this._messages().length > 0);

  addUserMessage(content: string): TextChatMessage {
    const msg: TextChatMessage = {
      id: crypto.randomUUID(),
      type: 'chat',
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    this._messages.update((msgs) => [...msgs, msg]);
    this.persist();
    return msg;
  }

  addAssistantMessage(content: string): TextChatMessage {
    const msg: TextChatMessage = {
      id: crypto.randomUUID(),
      type: 'chat',
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    this._messages.update((msgs) => [...msgs, msg]);
    this._streamingText.set('');
    this.persist();
    return msg;
  }

  addErrorMessage(errorText: string): void {
    const msg: TextChatMessage = {
      id: crypto.randomUUID(),
      type: 'chat',
      role: 'assistant',
      content: errorText,
      timestamp: new Date().toISOString(),
      status: 'error',
    };
    this._messages.update((msgs) => [...msgs, msg]);
    this.persist();
  }

  addActionMessage(
    toolName: string,
    args: Record<string, unknown>,
    summary: string,
    listName?: string,
  ): ActionChatMessage {
    const msg: ActionChatMessage = {
      id: crypto.randomUUID(),
      type: 'action',
      toolName,
      args,
      summary,
      listName,
      timestamp: new Date().toISOString(),
      count: 1,
    };
    this._messages.update((msgs) => [...msgs, msg]);
    this.persist();
    return msg;
  }

  addConfirmMessage(
    toolName: 'delete_list' | 'delete_item',
    args: Record<string, unknown>,
    summary: string,
  ): ConfirmChatMessage {
    const msg: ConfirmChatMessage = {
      id: crypto.randomUUID(),
      type: 'confirm',
      toolName,
      args,
      summary,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    this._messages.update((msgs) => [...msgs, msg]);
    this.persist();
    return msg;
  }

  addInfoMessage(toolName: string, summary: string): InfoChatMessage {
    const msg: InfoChatMessage = {
      id: crypto.randomUUID(),
      type: 'info',
      toolName,
      summary,
      timestamp: new Date().toISOString(),
    };
    this._messages.update((msgs) => [...msgs, msg]);
    this.persist();
    return msg;
  }

  addPreviewMessage(listName: string): PreviewChatMessage {
    const msg: PreviewChatMessage = {
      id: crypto.randomUUID(),
      type: 'preview',
      listName,
      timestamp: new Date().toISOString(),
    };
    this._messages.update((msgs) => [...msgs, msg]);
    this.persist();
    return msg;
  }

  addErrorActionMessage(toolName: string, summary: string): ErrorActionMessage {
    const msg: ErrorActionMessage = {
      id: crypto.randomUUID(),
      type: 'error-action',
      toolName,
      summary,
      timestamp: new Date().toISOString(),
    };
    this._messages.update((msgs) => [...msgs, msg]);
    this.persist();
    return msg;
  }

  updateMessage(id: string, partial: Partial<ChatMessage>): void {
    this._messages.update((msgs) =>
      msgs.map((m) => (m.id === id ? ({ ...m, ...partial } as ChatMessage) : m)),
    );
    this.persist();
  }

  updateActionCardCount(messageId: string, newCount: number, newSummary: string): void {
    this.updateMessage(messageId, {
      count: newCount,
      summary: newSummary,
    } as Partial<ActionChatMessage>);
  }

  setStreaming(text: string): void {
    this._streamingText.set(text);
  }

  appendStreamingDelta(delta: string): void {
    this._streamingText.update((current) => current + delta);
  }

  setProcessing(v: boolean): void {
    this._isProcessing.set(v);
  }

  setError(e: ChatError | null): void {
    this._error.set(e);
  }

  clearError(): void {
    this._error.set(null);
  }

  clearAll(): void {
    this._messages.set([]);
    this._streamingText.set('');
    this._isProcessing.set(false);
    this._error.set(null);
    this.persist();
  }

  /** Returns only text messages for AG-UI backend context */
  getAgUiMessages(): { id: string; role: string; content: string }[] {
    return this._messages()
      .filter((m): m is TextChatMessage => m.type === 'chat')
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      }));
  }

  /** Hydrate messages from localStorage, migrating old messages without type field */
  private hydrateMessages(): ChatMessage[] {
    const raw = this.storage.load<Record<string, unknown>[]>(this.storage.CHAT_KEY, []);
    return raw.map((m) =>
      m['type']
        ? (m as unknown as ChatMessage)
        : ({ ...m, type: 'chat' as const } as unknown as ChatMessage),
    );
  }

  private persist(): void {
    const messages = this._messages();
    const capped = messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;
    if (capped !== messages) {
      this._messages.set(capped);
    }
    this.storage.save(this.storage.CHAT_KEY, capped);
  }
}
