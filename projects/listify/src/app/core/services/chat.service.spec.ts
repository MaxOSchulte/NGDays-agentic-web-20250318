import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { StorageService } from './storage.service';
import {
  TextChatMessage,
  ActionChatMessage,
  ConfirmChatMessage,
  InfoChatMessage,
  ErrorActionMessage,
  PreviewChatMessage,
} from '../models/index';

describe('ChatService', () => {
  let service: ChatService;
  let storageSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatService);
    storageSpy = vi.spyOn(TestBed.inject(StorageService), 'save');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('hydration', () => {
    it('should load existing messages from localStorage on construction', () => {
      const existingMessages: TextChatMessage[] = [
        {
          id: 'msg-1',
          type: 'chat',
          role: 'user',
          content: 'Hello',
          timestamp: '2026-01-01T00:00:00Z',
          status: 'sent',
        },
        {
          id: 'msg-2',
          type: 'chat',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: '2026-01-01T00:00:01Z',
          status: 'sent',
        },
      ];
      localStorage.setItem('listify_chat_history', JSON.stringify(existingMessages));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(ChatService);

      expect(freshService.messages()).toHaveLength(2);
      expect((freshService.messages()[0] as TextChatMessage).content).toBe('Hello');
      expect((freshService.messages()[1] as TextChatMessage).content).toBe('Hi there!');
    });

    it('should add type "chat" to old messages without type field during hydration', () => {
      const legacyMessages = [
        {
          id: 'old-1',
          role: 'user',
          content: 'Legacy message',
          timestamp: '2026-01-01T00:00:00Z',
          status: 'sent',
        },
      ];
      localStorage.setItem('listify_chat_history', JSON.stringify(legacyMessages));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(ChatService);

      const msg = freshService.messages()[0];
      expect(msg.type).toBe('chat');
      expect((msg as TextChatMessage).role).toBe('user');
      expect((msg as TextChatMessage).content).toBe('Legacy message');
    });
  });

  describe('addUserMessage', () => {
    it('should add a user message with correct properties', () => {
      const msg = service.addUserMessage('Hello AI');

      expect(msg.type).toBe('chat');
      expect(msg.role).toBe('user');
      expect(msg.content).toBe('Hello AI');
      expect(msg.status).toBe('sent');
      expect(msg.id).toBeTruthy();
      expect(msg.timestamp).toBeTruthy();
      expect(service.messages()).toContainEqual(msg);
    });

    it('should persist after adding a user message', () => {
      service.addUserMessage('Hello');

      expect(storageSpy).toHaveBeenCalledWith('listify_chat_history', service.messages());
    });
  });

  describe('addAssistantMessage', () => {
    it('should add an assistant message with correct properties', () => {
      const msg = service.addAssistantMessage('Hello, I can help!');

      expect(msg.type).toBe('chat');
      expect(msg.role).toBe('assistant');
      expect(msg.content).toBe('Hello, I can help!');
      expect(msg.status).toBe('sent');
      expect(msg.id).toBeTruthy();
      expect(msg.timestamp).toBeTruthy();
      expect(service.messages()).toContainEqual(msg);
    });

    it('should clear streamingText when adding assistant message', () => {
      service.setStreaming('partial text...');
      expect(service.streamingText()).toBe('partial text...');

      service.addAssistantMessage('Complete response');

      expect(service.streamingText()).toBe('');
    });

    it('should persist after adding an assistant message', () => {
      service.addAssistantMessage('Response');

      expect(storageSpy).toHaveBeenCalledWith('listify_chat_history', service.messages());
    });
  });

  describe('addErrorMessage', () => {
    it('should add an assistant message with error status', () => {
      service.addErrorMessage('Something went wrong');

      const messages = service.messages();
      const lastMsg = messages[messages.length - 1] as TextChatMessage;
      expect(lastMsg.type).toBe('chat');
      expect(lastMsg.role).toBe('assistant');
      expect(lastMsg.content).toBe('Something went wrong');
      expect(lastMsg.status).toBe('error');
    });

    it('should persist the error message', () => {
      service.addErrorMessage('Error occurred');

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('addActionMessage', () => {
    it('should create an ActionChatMessage with correct properties', () => {
      const msg = service.addActionMessage(
        'create_list',
        { name: 'Groceries' },
        'Created list "Groceries"',
      );

      expect(msg.type).toBe('action');
      expect(msg.toolName).toBe('create_list');
      expect(msg.args).toEqual({ name: 'Groceries' });
      expect(msg.summary).toBe('Created list "Groceries"');
      expect(msg.count).toBe(1);
      expect(msg.id).toBeTruthy();
      expect(msg.timestamp).toBeTruthy();
    });

    it('should accept optional listName', () => {
      const msg = service.addActionMessage(
        'add_item',
        { list_name: 'Groceries', text: 'Milk' },
        'Added item',
        'Groceries',
      );

      expect(msg.listName).toBe('Groceries');
    });

    it('should persist the action message', () => {
      service.addActionMessage('create_list', { name: 'Test' }, 'Created list');

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('addConfirmMessage', () => {
    it('should create a ConfirmChatMessage with pending status', () => {
      const msg = service.addConfirmMessage(
        'delete_list',
        { list_name: 'abc' },
        'Delete "Shopping"?',
      );

      expect(msg.type).toBe('confirm');
      expect(msg.toolName).toBe('delete_list');
      expect(msg.args).toEqual({ list_name: 'abc' });
      expect(msg.summary).toBe('Delete "Shopping"?');
      expect(msg.status).toBe('pending');
      expect(msg.id).toBeTruthy();
    });

    it('should persist the confirm message', () => {
      service.addConfirmMessage('delete_item', { list_name: 'a', item_name: 'b' }, 'Delete item?');

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('addInfoMessage', () => {
    it('should create an InfoChatMessage', () => {
      const msg = service.addInfoMessage('get_all_lists', 'Queried 3 lists');

      expect(msg.type).toBe('info');
      expect(msg.toolName).toBe('get_all_lists');
      expect(msg.summary).toBe('Queried 3 lists');
      expect(msg.id).toBeTruthy();
    });

    it('should persist the info message', () => {
      service.addInfoMessage('get_all_lists', 'Queried lists');

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('addErrorActionMessage', () => {
    it('should create an ErrorActionMessage', () => {
      const msg = service.addErrorActionMessage('create_list', 'Name is required');

      expect(msg.type).toBe('error-action');
      expect(msg.toolName).toBe('create_list');
      expect(msg.summary).toBe('Name is required');
      expect(msg.id).toBeTruthy();
    });

    it('should persist the error action message', () => {
      service.addErrorActionMessage('add_item', 'List not found');

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('updateMessage', () => {
    it('should update a message by id with partial fields', () => {
      const msg = service.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      const originalMessages = service.messages();

      service.updateMessage(msg.id, { status: 'confirmed' } as Partial<ConfirmChatMessage>);

      const updated = service.messages().find((m) => m.id === msg.id) as ConfirmChatMessage;
      expect(updated.status).toBe('confirmed');
      // Verify immutability — new array reference
      expect(service.messages()).not.toBe(originalMessages);
    });

    it('should produce new object references for OnPush compatibility', () => {
      const msg = service.addActionMessage('add_item', { text: 'Milk' }, 'Added milk');
      const before = service.messages().find((m) => m.id === msg.id);

      service.updateMessage(msg.id, { summary: 'Updated summary' } as Partial<ActionChatMessage>);

      const after = service.messages().find((m) => m.id === msg.id);
      expect(after).not.toBe(before);
      expect((after as ActionChatMessage).summary).toBe('Updated summary');
    });

    it('should persist after update', () => {
      const msg = service.addActionMessage('add_item', {}, 'test');
      storageSpy.mockClear();

      service.updateMessage(msg.id, { summary: 'new' } as Partial<ActionChatMessage>);

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('updateActionCardCount', () => {
    it('should update count and summary on an action card', () => {
      const msg = service.addActionMessage(
        'add_item',
        { list_name: 'Groceries', text: 'Milk' },
        'Added 1 item',
        'Groceries',
      );

      service.updateActionCardCount(msg.id, 3, 'Added 3 items to "Groceries"');

      const updated = service.messages().find((m) => m.id === msg.id) as ActionChatMessage;
      expect(updated.count).toBe(3);
      expect(updated.summary).toBe('Added 3 items to "Groceries"');
    });
  });

  describe('streaming', () => {
    it('should set streaming text', () => {
      service.setStreaming('Hello');

      expect(service.streamingText()).toBe('Hello');
    });

    it('should append to streaming text', () => {
      service.setStreaming('Hello');
      service.appendStreamingDelta(' world');

      expect(service.streamingText()).toBe('Hello world');
    });

    it('should NOT persist on streaming updates', () => {
      service.setStreaming('partial');
      service.appendStreamingDelta(' text');

      expect(storageSpy).not.toHaveBeenCalled();
    });
  });

  describe('processing', () => {
    it('should set isProcessing signal', () => {
      expect(service.isProcessing()).toBe(false);

      service.setProcessing(true);

      expect(service.isProcessing()).toBe(true);

      service.setProcessing(false);

      expect(service.isProcessing()).toBe(false);
    });
  });

  describe('error management', () => {
    it('should set error signal', () => {
      service.setError({ message: 'Connection failed', retryContent: 'Hello' });

      expect(service.error()).toEqual({ message: 'Connection failed', retryContent: 'Hello' });
    });

    it('should clear error signal', () => {
      service.setError({ message: 'Error' });
      service.clearError();

      expect(service.error()).toBeNull();
    });
  });

  describe('getAgUiMessages', () => {
    it('should return only text messages in AG-UI format', () => {
      service.addUserMessage('Hello');
      service.addAssistantMessage('Hi');

      const agUiMessages = service.getAgUiMessages();

      expect(agUiMessages).toHaveLength(2);
      expect(agUiMessages[0]).toEqual(
        expect.objectContaining({
          role: 'user',
          content: 'Hello',
        }),
      );
      expect(agUiMessages[1]).toEqual(
        expect.objectContaining({
          role: 'assistant',
          content: 'Hi',
        }),
      );
      for (const msg of agUiMessages) {
        expect(msg).toHaveProperty('id');
        expect(msg).toHaveProperty('role');
        expect(msg).toHaveProperty('content');
      }
    });

    it('should filter out non-chat message types', () => {
      service.addUserMessage('Hello');
      service.addActionMessage('create_list', { name: 'Test' }, 'Created list');
      service.addConfirmMessage('delete_list', { list_name: 'a' }, 'Delete?');
      service.addInfoMessage('get_all_lists', 'Queried lists');
      service.addErrorActionMessage('add_item', 'Error');
      service.addAssistantMessage('Done');

      const agUiMessages = service.getAgUiMessages();

      expect(agUiMessages).toHaveLength(2);
      expect(agUiMessages[0].content).toBe('Hello');
      expect(agUiMessages[1].content).toBe('Done');
    });
  });

  describe('addPreviewMessage', () => {
    it('should create a PreviewChatMessage with correct properties', () => {
      const msg = service.addPreviewMessage('list-123');

      expect(msg.type).toBe('preview');
      expect(msg.listName).toBe('list-123');
      expect(msg.id).toBeTruthy();
      expect(msg.timestamp).toBeTruthy();
      expect(service.messages()).toContainEqual(msg);
    });

    it('should persist the preview message', () => {
      service.addPreviewMessage('list-abc');

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('hasMessages', () => {
    it('should be false when no messages', () => {
      expect(service.hasMessages()).toBe(false);
    });

    it('should be true after adding a message', () => {
      service.addUserMessage('Hello');

      expect(service.hasMessages()).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should reset all state to defaults', () => {
      service.addUserMessage('Hello');
      service.addAssistantMessage('Hi');
      service.setStreaming('partial...');
      service.setProcessing(true);
      service.setError({ message: 'Error', retryContent: 'Hello' });

      service.clearAll();

      expect(service.messages()).toEqual([]);
      expect(service.streamingText()).toBe('');
      expect(service.isProcessing()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should return hasMessages() as false after clearing', () => {
      service.addUserMessage('Hello');
      expect(service.hasMessages()).toBe(true);

      service.clearAll();

      expect(service.hasMessages()).toBe(false);
    });

    it('should persist empty state after clearing', () => {
      service.addUserMessage('Hello');
      storageSpy.mockClear();

      service.clearAll();

      expect(storageSpy).toHaveBeenCalledWith('listify_chat_history', []);
    });
  });

  describe('message cap', () => {
    it('should cap messages at 200 and prune oldest', () => {
      for (let i = 0; i < 201; i++) {
        service.addUserMessage(`Message ${i}`);
      }

      expect(service.messages()).toHaveLength(200);
      expect((service.messages()[0] as TextChatMessage).content).toBe('Message 1');
      expect((service.messages()[199] as TextChatMessage).content).toBe('Message 200');
    });
  });
});
