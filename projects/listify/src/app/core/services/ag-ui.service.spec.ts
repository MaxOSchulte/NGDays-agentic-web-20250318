import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { AgUiService } from './ag-ui.service';
import { ChatService } from './chat.service';
import { ConfirmationService } from './confirmation.service';
import { ListService } from './list.service';
import {
  TextChatMessage,
  ActionChatMessage,
  ConfirmChatMessage,
  InfoChatMessage,
  ErrorActionMessage,
  PreviewChatMessage,
} from '../models/index';
import { ViewContextService } from './view-context.service';

import { signal } from '@angular/core';
import { Router, Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyService = any;

/**
 * Test subclass to expose private emitToolMessage for direct testing.
 * The actual wiring is tested via executeRunAgent integration.
 */
@Injectable()
class TestableAgUiService extends AgUiService {
  testEmitToolMessage(toolName: string, args: Record<string, unknown>): void {
    // Access the private method via bracket notation for testing
    (this as AnyService).emitToolMessage(toolName, args);
  }

  testClearGrouping(): void {
    (this as AnyService).currentRunActionCards.clear();
  }

  testSendProactiveMessage(listName: string, trigger: 'empty' | 'all-complete'): Promise<void> {
    return (this as AnyService).sendProactiveMessage(listName, trigger);
  }
}

describe('AgUiService', () => {
  let service: TestableAgUiService;
  let chatService: ChatService;
  let listService: ListService;
  let confirmationService: ConfirmationService;

  let routerEvents$: Subject<RouterEvent>;

  beforeEach(() => {
    localStorage.clear();
    routerEvents$ = new Subject<RouterEvent>();
    TestBed.configureTestingModule({
      providers: [
        { provide: AgUiService, useClass: TestableAgUiService },
        {
          provide: Router,
          useValue: {
            events: routerEvents$.asObservable(),
          },
        },
      ],
    });
    service = TestBed.inject(AgUiService) as TestableAgUiService;
    chatService = TestBed.inject(ChatService);
    listService = TestBed.inject(ListService);
    confirmationService = TestBed.inject(ConfirmationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendMessage', () => {
    it('should clear error before processing', async () => {
      const clearErrorSpy = vi.spyOn(chatService, 'clearError');
      vi.spyOn(service as AnyService, 'executeRunAgent').mockResolvedValue(undefined);

      await service.sendMessage('Hello');

      expect(clearErrorSpy).toHaveBeenCalled();
    });

    it('should set processing to true on send', async () => {
      const setProcessingSpy = vi.spyOn(chatService, 'setProcessing');
      vi.spyOn(service as AnyService, 'executeRunAgent').mockResolvedValue(undefined);

      await service.sendMessage('Hello');

      expect(setProcessingSpy).toHaveBeenCalledWith(true);
    });

    it('should add user message to chat service', async () => {
      const addUserMsgSpy = vi.spyOn(chatService, 'addUserMessage').mockReturnValue({
        id: 'test-id',
        type: 'chat',
        role: 'user',
        content: 'Hello',
        timestamp: new Date().toISOString(),
        status: 'sent',
      } as TextChatMessage);
      vi.spyOn(service as AnyService, 'executeRunAgent').mockResolvedValue(undefined);

      await service.sendMessage('Hello');

      expect(addUserMsgSpy).toHaveBeenCalledWith('Hello');
    });

    it('should set error and clear processing on network failure', async () => {
      const setErrorSpy = vi.spyOn(chatService, 'setError');
      const setProcessingSpy = vi.spyOn(chatService, 'setProcessing');
      vi.spyOn(service as AnyService, 'executeRunAgent').mockRejectedValue(
        new Error('Network error'),
      );

      await service.sendMessage('Hello');

      expect(setErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to connect to AI assistant',
          retryContent: 'Hello',
        }),
      );
      expect(setProcessingSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('retry', () => {
    it('should resend the retryContent from current error', async () => {
      chatService.setError({ message: 'Error occurred', retryContent: 'Original message' });
      const sendMessageSpy = vi.spyOn(service, 'sendMessage').mockResolvedValue();

      await service.retry();

      expect(sendMessageSpy).toHaveBeenCalledWith('Original message');
    });

    it('should not send if no retryContent in error', async () => {
      chatService.setError({ message: 'Error without retry' });
      const sendMessageSpy = vi.spyOn(service, 'sendMessage').mockResolvedValue();

      await service.retry();

      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('should not send if no error exists', async () => {
      const sendMessageSpy = vi.spyOn(service, 'sendMessage').mockResolvedValue();

      await service.retry();

      expect(sendMessageSpy).not.toHaveBeenCalled();
    });
  });

  describe('threadId persistence', () => {
    it('should create and persist a threadId in localStorage', () => {
      const threadId = localStorage.getItem('listify_thread_id');
      expect(threadId).toBeTruthy();
      expect(threadId!.length).toBeGreaterThan(0);
    });

    it('should reuse existing threadId from localStorage', () => {
      const firstThreadId = localStorage.getItem('listify_thread_id');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: AgUiService, useClass: TestableAgUiService }],
      });
      TestBed.inject(AgUiService);

      const secondThreadId = localStorage.getItem('listify_thread_id');
      expect(secondThreadId).toBe(firstThreadId);
    });
  });

  describe('getListState', () => {
    it('should return empty lists when no lists exist', () => {
      const state = service.getListState();
      expect(state.lists).toEqual([]);
    });

    it('should include currentScreen and currentListName in state', () => {
      const state = service.getListState();
      expect(state).toHaveProperty('currentScreen');
      expect(state).toHaveProperty('currentListName');
      expect(state.currentScreen).toBe('chat');
      expect(state.currentListName).toBeNull();
    });

    it('should serialize list data correctly', () => {
      const list = listService.createList('Groceries');
      listService.addItem(list.name, 'Milk');

      const state = service.getListState();

      expect(state.lists).toHaveLength(1);
      expect(state.lists[0].name).toBe('Groceries');
      expect(state.lists[0].items).toHaveLength(1);
      expect(state.lists[0].items[0].text).toBe('Milk');
      expect(state.lists[0].items[0].completed).toBe(false);
    });

    it('should include all list fields in serialized state', () => {
      listService.createList('Work');

      const state = service.getListState();
      const serialized = state.lists[0];

      expect(serialized).toHaveProperty('name');
      expect(serialized).toHaveProperty('items');
      expect(serialized).toHaveProperty('createdAt');
      expect(serialized).toHaveProperty('updatedAt');
    });
  });

  describe('applyToolResult', () => {
    it('should create a list via ListService for create_list tool', () => {
      const createSpy = vi.spyOn(listService, 'createList');

      service.applyToolResult('create_list', { name: 'Shopping' });

      expect(createSpy).toHaveBeenCalledWith('Shopping');
    });

    it('should add an item via ListService for add_item tool', () => {
      const list = listService.createList('Test');
      const addSpy = vi.spyOn(listService, 'addItem');

      service.applyToolResult('add_item', { list_name: list.name, text: 'Buy eggs' });

      expect(addSpy).toHaveBeenCalledWith(list.name, 'Buy eggs');
    });

    it('should toggle an item via ListService for mark_item_complete tool', () => {
      const list = listService.createList('Test');
      const item = listService.addItem(list.name, 'Task');
      const toggleSpy = vi.spyOn(listService, 'toggleItem');

      service.applyToolResult('mark_item_complete', {
        list_name: list.name,
        item_name: item.text,
      });

      expect(toggleSpy).toHaveBeenCalledWith(list.name, item.text);
    });

    it('should NOT auto-apply delete_list', () => {
      const list = listService.createList('To Delete');
      const deleteSpy = vi.spyOn(listService, 'deleteList');

      service.applyToolResult('delete_list', { list_name: list.name });

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should NOT auto-apply delete_item', () => {
      const list = listService.createList('Test');
      const item = listService.addItem(list.name, 'Task');
      const deleteItemSpy = vi.spyOn(listService, 'deleteItem');

      service.applyToolResult('delete_item', {
        list_name: list.name,
        item_name: item.text,
      });

      expect(deleteItemSpy).not.toHaveBeenCalled();
    });

    it('should do nothing for read-only tools', () => {
      const createSpy = vi.spyOn(listService, 'createList');
      const addSpy = vi.spyOn(listService, 'addItem');

      service.applyToolResult('get_all_lists', {});
      service.applyToolResult('get_list_details', { list_name: 'abc' });
      service.applyToolResult('search_items', { query: 'test' });

      expect(createSpy).not.toHaveBeenCalled();
      expect(addSpy).not.toHaveBeenCalled();
    });
  });

  describe('emitToolMessage', () => {
    describe('mutation tools (non-destructive)', () => {
      it('should emit ActionChatMessage for create_list', () => {
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage');

        service.testEmitToolMessage('create_list', { name: 'Groceries' });

        expect(addActionSpy).toHaveBeenCalledWith(
          'create_list',
          { name: 'Groceries' },
          'Created list "Groceries"',
          undefined,
        );
      });

      it('should emit ActionChatMessage for add_item with listName', () => {
        const list = listService.createList('Groceries');
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage');

        service.testEmitToolMessage('add_item', { list_name: list.name, text: 'Milk' });

        expect(addActionSpy).toHaveBeenCalledWith(
          'add_item',
          { list_name: list.name, text: 'Milk' },
          expect.stringContaining('Added "Milk"'),
          list.name,
        );
      });

      it('should emit ActionChatMessage for mark_item_complete', () => {
        const list = listService.createList('Tasks');
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage');

        service.testEmitToolMessage('mark_item_complete', {
          list_name: list.name,
          item_name: 'Do laundry',
        });

        expect(addActionSpy).toHaveBeenCalledWith(
          'mark_item_complete',
          { list_name: list.name, item_name: 'Do laundry' },
          expect.stringContaining('Completed item'),
          list.name,
        );
      });
    });

    describe('destructive tools', () => {
      it('should emit ConfirmChatMessage for delete_list', () => {
        const list = listService.createList('Shopping');
        const addConfirmSpy = vi.spyOn(chatService, 'addConfirmMessage');
        const enqueueSpy = vi.spyOn(confirmationService, 'enqueue');

        service.testEmitToolMessage('delete_list', { list_name: list.name });

        expect(addConfirmSpy).toHaveBeenCalledWith(
          'delete_list',
          { list_name: list.name },
          expect.stringContaining('Delete'),
        );
        expect(enqueueSpy).toHaveBeenCalled();
      });

      it('should emit ConfirmChatMessage for delete_item', () => {
        const list = listService.createList('Tasks');
        const addConfirmSpy = vi.spyOn(chatService, 'addConfirmMessage');
        const enqueueSpy = vi.spyOn(confirmationService, 'enqueue');

        service.testEmitToolMessage('delete_item', {
          list_name: list.name,
          item_name: 'item-1',
        });

        expect(addConfirmSpy).toHaveBeenCalledWith(
          'delete_item',
          { list_name: list.name, item_name: 'item-1' },
          expect.stringContaining('Delete item'),
        );
        expect(enqueueSpy).toHaveBeenCalled();
      });
    });

    describe('read-only tools', () => {
      it('should emit InfoChatMessage for get_all_lists', () => {
        listService.createList('A');
        listService.createList('B');
        const addInfoSpy = vi.spyOn(chatService, 'addInfoMessage');

        service.testEmitToolMessage('get_all_lists', {});

        expect(addInfoSpy).toHaveBeenCalledWith('get_all_lists', 'Queried 2 lists');
      });

      it('should emit PreviewChatMessage for get_list_details with list_name', () => {
        const list = listService.createList('Groceries');
        const addPreviewSpy = vi.spyOn(chatService, 'addPreviewMessage');
        const addInfoSpy = vi.spyOn(chatService, 'addInfoMessage');

        service.testEmitToolMessage('get_list_details', { list_name: list.name });

        expect(addPreviewSpy).toHaveBeenCalledWith(list.name);
        expect(addInfoSpy).not.toHaveBeenCalled();
      });

      it('should emit InfoChatMessage for search_items', () => {
        const addInfoSpy = vi.spyOn(chatService, 'addInfoMessage');

        service.testEmitToolMessage('search_items', { query: 'milk' });

        expect(addInfoSpy).toHaveBeenCalledWith('search_items', 'Searched items');
      });
    });

    describe('error handling', () => {
      it('should emit ErrorActionMessage when args contain error', () => {
        const addErrorActionSpy = vi.spyOn(chatService, 'addErrorActionMessage');

        service.testEmitToolMessage('create_list', { error: 'Name is required' });

        expect(addErrorActionSpy).toHaveBeenCalledWith('create_list', 'Name is required');
      });

      it('should not emit other message types when error is present', () => {
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage');
        const addConfirmSpy = vi.spyOn(chatService, 'addConfirmMessage');
        const addInfoSpy = vi.spyOn(chatService, 'addInfoMessage');

        service.testEmitToolMessage('create_list', { error: 'Some error' });

        expect(addActionSpy).not.toHaveBeenCalled();
        expect(addConfirmSpy).not.toHaveBeenCalled();
        expect(addInfoSpy).not.toHaveBeenCalled();
      });
    });

    describe('grouping', () => {
      it('should group consecutive add_item calls to the same list', () => {
        const list = listService.createList('Groceries');
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage').mockReturnValue({
          id: 'card-1',
          type: 'action',
          toolName: 'add_item',
          args: {},
          summary: 'Added item',
          listName: list.name,
          count: 1,
          timestamp: new Date().toISOString(),
        } as ActionChatMessage);
        const updateCountSpy = vi.spyOn(chatService, 'updateActionCardCount');
        // Mock messages to return the card we created
        vi.spyOn(chatService, 'messages').mockReturnValue([
          {
            id: 'card-1',
            type: 'action',
            toolName: 'add_item',
            args: {},
            summary: 'Added item',
            listName: list.name,
            count: 1,
            timestamp: new Date().toISOString(),
          } as ActionChatMessage,
        ]);

        // First call creates a card
        service.testEmitToolMessage('add_item', { list_name: list.name, text: 'Milk' });
        // Second call should update the existing card
        service.testEmitToolMessage('add_item', { list_name: list.name, text: 'Eggs' });

        expect(addActionSpy).toHaveBeenCalledTimes(1);
        expect(updateCountSpy).toHaveBeenCalledWith(
          'card-1',
          2,
          expect.stringContaining('Added 2 items'),
        );
      });

      it('should NOT group add_item calls to different lists', () => {
        const list1 = listService.createList('Groceries');
        const list2 = listService.createList('Tasks');
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage').mockReturnValue({
          id: 'card-1',
          type: 'action',
          toolName: 'add_item',
          args: {},
          summary: 'Added item',
          listName: list1.name,
          count: 1,
          timestamp: new Date().toISOString(),
        } as ActionChatMessage);

        service.testEmitToolMessage('add_item', { list_name: list1.name, text: 'Milk' });
        service.testEmitToolMessage('add_item', { list_name: list2.name, text: 'Fix bug' });

        expect(addActionSpy).toHaveBeenCalledTimes(2);
      });

      it('should reset grouping when clearGrouping is called', () => {
        const list = listService.createList('Groceries');
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage').mockReturnValue({
          id: 'card-1',
          type: 'action',
          toolName: 'add_item',
          args: {},
          summary: 'Added item',
          listName: list.name,
          count: 1,
          timestamp: new Date().toISOString(),
        } as ActionChatMessage);

        service.testEmitToolMessage('add_item', { list_name: list.name, text: 'Milk' });
        service.testClearGrouping();
        service.testEmitToolMessage('add_item', { list_name: list.name, text: 'Eggs' });

        // After clearing, a new card should be created
        expect(addActionSpy).toHaveBeenCalledTimes(2);
      });

      it('should not group create_list calls', () => {
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage').mockReturnValue({
          id: 'card-1',
          type: 'action',
          toolName: 'create_list',
          args: {},
          summary: 'Created list',
          count: 1,
          timestamp: new Date().toISOString(),
        } as ActionChatMessage);

        service.testEmitToolMessage('create_list', { name: 'A' });
        service.testEmitToolMessage('create_list', { name: 'B' });

        expect(addActionSpy).toHaveBeenCalledTimes(2);
      });
    });

    describe('summary generation', () => {
      it('should generate correct summary for create_list', () => {
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage');

        service.testEmitToolMessage('create_list', { name: 'Groceries' });

        expect(addActionSpy).toHaveBeenCalledWith(
          'create_list',
          expect.any(Object),
          'Created list "Groceries"',
          undefined,
        );
      });

      it('should generate correct summary for delete_list with items', () => {
        const list = listService.createList('Tasks');
        listService.addItem(list.name, 'Task 1');
        const item2 = listService.addItem(list.name, 'Task 2');
        listService.toggleItem(list.name, item2.text);
        const addConfirmSpy = vi.spyOn(chatService, 'addConfirmMessage');

        service.testEmitToolMessage('delete_list', { list_name: list.name });

        expect(addConfirmSpy).toHaveBeenCalledWith(
          'delete_list',
          { list_name: list.name },
          'Delete "Tasks"? 1/2 items completed',
        );
      });

      it('should generate fallback summary for unknown tool', () => {
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage');

        service.testEmitToolMessage('unknown_tool', { foo: 'bar' });

        expect(addActionSpy).toHaveBeenCalledWith(
          'unknown_tool',
          { foo: 'bar' },
          'Executed unknown_tool',
          undefined,
        );
      });
    });

    describe('preview card emission', () => {
      it('should emit preview card for add_item alongside action card', () => {
        const list = listService.createList('Groceries');
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage');
        const addPreviewSpy = vi.spyOn(chatService, 'addPreviewMessage');

        service.testEmitToolMessage('add_item', { list_name: list.name, text: 'Milk' });

        expect(addActionSpy).toHaveBeenCalled();
        expect(addPreviewSpy).toHaveBeenCalledWith(list.name);
      });

      it('should emit preview card for mark_item_complete alongside action card', () => {
        const list = listService.createList('Tasks');
        const addActionSpy = vi.spyOn(chatService, 'addActionMessage');
        const addPreviewSpy = vi.spyOn(chatService, 'addPreviewMessage');

        service.testEmitToolMessage('mark_item_complete', {
          list_name: list.name,
          item_name: 'Do laundry',
        });

        expect(addActionSpy).toHaveBeenCalled();
        expect(addPreviewSpy).toHaveBeenCalledWith(list.name);
      });

      it('should NOT emit preview card for create_list', () => {
        const addPreviewSpy = vi.spyOn(chatService, 'addPreviewMessage');

        service.testEmitToolMessage('create_list', { name: 'Shopping' });

        expect(addPreviewSpy).not.toHaveBeenCalled();
      });

      it('should NOT emit preview card for get_all_lists', () => {
        const addPreviewSpy = vi.spyOn(chatService, 'addPreviewMessage');

        service.testEmitToolMessage('get_all_lists', {});

        expect(addPreviewSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('executeRunAgent empty messages guard', () => {
    it('should inject transient user message when getAgUiMessages returns empty array', async () => {
      const content = 'Hello from proactive trigger';
      vi.spyOn(chatService, 'getAgUiMessages').mockReturnValue([]);

      const agent = (service as AnyService).agent;
      const setMessagesSpy = vi.spyOn(agent, 'setMessages');
      vi.spyOn(agent, 'runAgent').mockResolvedValue(undefined);

      await (service as AnyService).executeRunAgent(content);

      expect(setMessagesSpy).toHaveBeenCalledWith([
        expect.objectContaining({
          role: 'user',
          content,
        }),
      ]);
      // Exactly one message should be passed
      expect(setMessagesSpy.mock.calls[0][0]).toHaveLength(1);
    });

    it('should use existing messages when getAgUiMessages returns non-empty array', async () => {
      const existingMessages = [
        { id: 'msg-1', role: 'user', content: 'Hi' },
        { id: 'msg-2', role: 'assistant', content: 'Hello!' },
      ];
      vi.spyOn(chatService, 'getAgUiMessages').mockReturnValue(existingMessages);

      const agent = (service as AnyService).agent;
      const setMessagesSpy = vi.spyOn(agent, 'setMessages');
      vi.spyOn(agent, 'runAgent').mockResolvedValue(undefined);

      await (service as AnyService).executeRunAgent('new message');

      expect(setMessagesSpy).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'msg-1', role: 'user', content: 'Hi' }),
        expect.objectContaining({ id: 'msg-2', role: 'assistant', content: 'Hello!' }),
      ]);
      expect(setMessagesSpy.mock.calls[0][0]).toHaveLength(2);
    });

    it('should NOT call chatService.addUserMessage when sendProactiveMessage fires on empty chat', async () => {
      const list = listService.createList('Test List');
      vi.spyOn(chatService, 'getAgUiMessages').mockReturnValue([]);

      const agent = (service as AnyService).agent;
      vi.spyOn(agent, 'setMessages');
      vi.spyOn(agent, 'runAgent').mockResolvedValue(undefined);

      const addUserMsgSpy = vi.spyOn(chatService, 'addUserMessage');

      await service.testSendProactiveMessage(list.name, 'empty');

      expect(addUserMsgSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendProactiveMessage', () => {
    it('should call executeRunAgent with system content for empty list', async () => {
      const list = listService.createList('Empty List');
      const executeRunSpy = vi
        .spyOn(service as AnyService, 'executeRunAgent')
        .mockResolvedValue(undefined);

      await service.testSendProactiveMessage(list.name, 'empty');

      expect(executeRunSpy).toHaveBeenCalledWith(expect.stringContaining('Empty List'));
      expect(executeRunSpy).toHaveBeenCalledWith(expect.stringContaining('no items'));
    });

    it('should call executeRunAgent with system content for all-complete list', async () => {
      const list = listService.createList('Done List');
      const executeRunSpy = vi
        .spyOn(service as AnyService, 'executeRunAgent')
        .mockResolvedValue(undefined);

      await service.testSendProactiveMessage(list.name, 'all-complete');

      expect(executeRunSpy).toHaveBeenCalledWith(expect.stringContaining('Done List'));
      expect(executeRunSpy).toHaveBeenCalledWith(expect.stringContaining('complete'));
    });

    it('should skip when already processing', async () => {
      const list = listService.createList('Busy List');
      chatService.setProcessing(true);
      const executeRunSpy = vi
        .spyOn(service as AnyService, 'executeRunAgent')
        .mockResolvedValue(undefined);

      await service.testSendProactiveMessage(list.name, 'empty');

      expect(executeRunSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if list not found', async () => {
      const executeRunSpy = vi
        .spyOn(service as AnyService, 'executeRunAgent')
        .mockResolvedValue(undefined);

      await service.testSendProactiveMessage('nonexistent-list', 'empty');

      expect(executeRunSpy).not.toHaveBeenCalled();
    });
  });
});
