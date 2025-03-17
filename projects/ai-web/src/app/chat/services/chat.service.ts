import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AiService,
  DialogMessage,
} from '../../../../../ai-tooling/src/public-api';
import { LocalStorageService } from '../../local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private messagesSignal = signal<DialogMessage[]>([]);
  private aiService = inject(AiService);

  public messages = this.messagesSignal.asReadonly();

  constructor(private localStorageService: LocalStorageService) {
    // Load messages from localStorage
    const savedMessages = this.localStorageService.loadChatMessages();

    // If we have saved messages, use them; otherwise start with a welcome message
    if (savedMessages.length > 0) {
      this.messagesSignal.set(savedMessages);
    }

    inject(AiService)
      .message$.pipe(takeUntilDestroyed())
      .subscribe((message) => this.receiveMessage(message));
  }

  sendMessage(content: string) {
    if (!content.trim()) return;

    const newMessage: DialogMessage = {
      source: { role: 'user', content },
      role: 'user',
      message: content,
      timestamp: new Date(),
    };

    const updatedMessages = [...this.messagesSignal(), newMessage];

    this.aiService.automate(
      content,
      this.messages()
        .map(({ source }) => source)
        .filter((source) => !!source),
    );

    this.messagesSignal.set(updatedMessages);
    this.localStorageService.saveChatMessages(updatedMessages);
  }

  receiveMessage(message: DialogMessage) {
    const updatedMessages = [...this.messagesSignal(), message];
    this.messagesSignal.set(updatedMessages);
    this.localStorageService.saveChatMessages(updatedMessages);
  }

  clearMessages() {
    this.messagesSignal.set([]);
    this.localStorageService.clearChatMessages();
    this.localStorageService.saveChatMessages([]);
  }
}
