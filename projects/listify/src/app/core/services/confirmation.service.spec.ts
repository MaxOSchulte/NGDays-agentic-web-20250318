import { TestBed } from '@angular/core/testing';
import { ConfirmationService } from './confirmation.service';
import { ChatService } from './chat.service';
import { ListService } from './list.service';
import { StorageService } from './storage.service';
import { ConfirmChatMessage } from '../models/index';

describe('ConfirmationService', () => {
  let service: ConfirmationService;
  let chatService: ChatService;
  let listService: ListService;
  let storageService: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmationService);
    chatService = TestBed.inject(ChatService);
    listService = TestBed.inject(ListService);
    storageService = TestBed.inject(StorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('enqueue', () => {
    it('should set pendingId when no current pending', () => {
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');

      service.enqueue(msg);

      expect(service.pendingId()).toBe(msg.id);
      expect(service.hasPending()).toBe(true);
    });

    it('should queue second message when one is already pending', () => {
      const msg1 = chatService.addConfirmMessage('delete_list', { list_name: 'a' }, 'Delete A?');
      const msg2 = chatService.addConfirmMessage('delete_list', { list_name: 'b' }, 'Delete B?');

      service.enqueue(msg1);
      service.enqueue(msg2);

      // First message is pending
      expect(service.pendingId()).toBe(msg1.id);
    });

    it('should persist pendingId in localStorage', () => {
      const saveSpy = vi.spyOn(storageService, 'save');
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');

      service.enqueue(msg);

      expect(saveSpy).toHaveBeenCalledWith('listify_pending_confirm', msg.id);
    });
  });

  describe('confirm', () => {
    it('should call listService.deleteList for delete_list tool', () => {
      const list = listService.createList('Groceries');
      const msg = chatService.addConfirmMessage('delete_list', { list_name: list.name }, 'Delete?');
      service.enqueue(msg);
      const deleteSpy = vi.spyOn(listService, 'deleteList');

      service.confirm(msg.id);

      expect(deleteSpy).toHaveBeenCalledWith(list.name);
    });

    it('should call listService.deleteItem for delete_item tool', () => {
      const list = listService.createList('Groceries');
      const item = listService.addItem(list.name, 'Milk');
      const msg = chatService.addConfirmMessage(
        'delete_item',
        { list_name: list.name, item_name: item.text },
        'Delete item?',
      );
      service.enqueue(msg);
      const deleteItemSpy = vi.spyOn(listService, 'deleteItem');

      service.confirm(msg.id);

      expect(deleteItemSpy).toHaveBeenCalledWith(list.name, item.text);
    });

    it('should update message status to confirmed', () => {
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      service.enqueue(msg);

      service.confirm(msg.id);

      const updated = chatService.messages().find((m) => m.id === msg.id) as ConfirmChatMessage;
      expect(updated.status).toBe('confirmed');
    });

    it('should advance queue after confirming', () => {
      const msg1 = chatService.addConfirmMessage('delete_list', { list_name: 'a' }, 'Delete A?');
      const msg2 = chatService.addConfirmMessage('delete_list', { list_name: 'b' }, 'Delete B?');
      service.enqueue(msg1);
      service.enqueue(msg2);

      service.confirm(msg1.id);

      expect(service.pendingId()).toBe(msg2.id);
      expect(service.hasPending()).toBe(true);
    });

    it('should clear pending when queue is empty', () => {
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      service.enqueue(msg);

      service.confirm(msg.id);

      expect(service.pendingId()).toBeNull();
      expect(service.hasPending()).toBe(false);
    });

    it('should do nothing for non-existent message id', () => {
      const deleteSpy = vi.spyOn(listService, 'deleteList');

      service.confirm('nonexistent');

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should do nothing for non-confirm message type', () => {
      const textMsg = chatService.addUserMessage('Hello');
      const deleteSpy = vi.spyOn(listService, 'deleteList');

      service.confirm(textMsg.id);

      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should update message status to cancelled', () => {
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      service.enqueue(msg);

      service.cancel(msg.id);

      const updated = chatService.messages().find((m) => m.id === msg.id) as ConfirmChatMessage;
      expect(updated.status).toBe('cancelled');
    });

    it('should advance queue after cancelling', () => {
      const msg1 = chatService.addConfirmMessage('delete_list', { list_name: 'a' }, 'Delete A?');
      const msg2 = chatService.addConfirmMessage('delete_list', { list_name: 'b' }, 'Delete B?');
      service.enqueue(msg1);
      service.enqueue(msg2);

      service.cancel(msg1.id);

      expect(service.pendingId()).toBe(msg2.id);
    });

    it('should clear pending when queue is empty', () => {
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      service.enqueue(msg);

      service.cancel(msg.id);

      expect(service.pendingId()).toBeNull();
      expect(service.hasPending()).toBe(false);
    });

    it('should not call deleteList or deleteItem', () => {
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      service.enqueue(msg);
      const deleteSpy = vi.spyOn(listService, 'deleteList');

      service.cancel(msg.id);

      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  describe('hasPending', () => {
    it('should be false initially', () => {
      expect(service.hasPending()).toBe(false);
    });

    it('should be true after enqueue', () => {
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      service.enqueue(msg);

      expect(service.hasPending()).toBe(true);
    });

    it('should be false after all confirmed', () => {
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      service.enqueue(msg);
      service.confirm(msg.id);

      expect(service.hasPending()).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should rehydrate pendingId from localStorage', () => {
      localStorage.setItem('listify_pending_confirm', JSON.stringify('saved-id'));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(ConfirmationService);

      expect(freshService.pendingId()).toBe('saved-id');
      expect(freshService.hasPending()).toBe(true);
    });

    it('should remove pendingId from localStorage when cleared', () => {
      const removeSpy = vi.spyOn(storageService, 'remove');
      const msg = chatService.addConfirmMessage('delete_list', { list_name: 'abc' }, 'Delete?');
      service.enqueue(msg);

      service.confirm(msg.id);

      expect(removeSpy).toHaveBeenCalledWith('listify_pending_confirm');
    });
  });
});
