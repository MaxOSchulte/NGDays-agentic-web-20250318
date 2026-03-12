import { TestBed } from '@angular/core/testing';
import { ListService } from './list.service';
import { StorageService } from './storage.service';
import { TodoList } from '../models/index';

describe('ListService', () => {
  let service: ListService;
  let storageSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListService);
    storageSpy = vi.spyOn(TestBed.inject(StorageService), 'save');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createList', () => {
    it('should add a new list with correct properties', () => {
      const list = service.createList('Groceries');

      expect(list.name).toBe('Groceries');
      expect(list.items).toEqual([]);
      expect(list.createdAt).toBeTruthy();
      expect(list.updatedAt).toBeTruthy();
      expect(service.lists()).toContainEqual(list);
    });

    it('should accumulate multiple lists', () => {
      service.createList('Groceries');
      service.createList('Shopping');

      expect(service.lists()).toHaveLength(2);
    });

    it('should persist after creating a list', () => {
      service.createList('Groceries');

      expect(storageSpy).toHaveBeenCalledWith('listify_lists', service.lists());
    });
  });

  describe('lists', () => {
    it('should return a readonly signal of all TodoList[]', () => {
      expect(service.lists()).toEqual([]);

      service.createList('Test');

      expect(service.lists()).toHaveLength(1);
    });
  });

  describe('getListByName', () => {
    it('should return the list with the matching name', () => {
      const created = service.createList('Groceries');
      const found = service.getListByName(created.name);

      expect(found).toEqual(created);
    });

    it('should return undefined for nonexistent name', () => {
      expect(service.getListByName('nonexistent')).toBeUndefined();
    });
  });

  describe('renameList', () => {
    it('should update the list name', () => {
      const list = service.createList('Old Name');
      service.renameList(list.name, 'New Name');

      expect(service.getListByName('New Name')?.name).toBe('New Name');
    });

    it('should update the updatedAt timestamp', async () => {
      const list = service.createList('Test');
      const originalUpdatedAt = list.updatedAt;

      // Wait a tick to ensure timestamps differ
      await new Promise((resolve) => setTimeout(resolve, 5));

      service.renameList(list.name, 'Updated');
      const updatedList = service.getListByName('Updated');

      expect(updatedList?.updatedAt).toBeTruthy();
      expect(updatedList?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should persist after renaming', () => {
      const list = service.createList('Test');
      storageSpy.mockClear();

      service.renameList(list.name, 'Renamed');

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('deleteList', () => {
    it('should remove the list from the lists signal', () => {
      const list = service.createList('To Delete');
      service.deleteList(list.name);

      expect(service.lists()).not.toContainEqual(expect.objectContaining({ name: list.name }));
    });

    it('should persist after deleting', () => {
      const list = service.createList('To Delete');
      storageSpy.mockClear();

      service.deleteList(list.name);

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    it('should add an item to the specified list', () => {
      const list = service.createList('Groceries');
      const item = service.addItem(list.name, 'Buy milk');

      expect(item.text).toBe('Buy milk');
      expect(item.completed).toBe(false);
      expect(service.getListByName(list.name)?.items).toContainEqual(item);
    });

    it('should persist after adding an item', () => {
      const list = service.createList('Groceries');
      storageSpy.mockClear();

      service.addItem(list.name, 'Buy milk');

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('toggleItem', () => {
    it('should flip completed from false to true', () => {
      const list = service.createList('Test');
      const item = service.addItem(list.name, 'Task');

      service.toggleItem(list.name, item.text);

      const toggledItem = service.getListByName(list.name)?.items.find((i) => i.text === item.text);
      expect(toggledItem?.completed).toBe(true);
    });

    it('should flip completed back to false on second toggle', () => {
      const list = service.createList('Test');
      const item = service.addItem(list.name, 'Task');

      service.toggleItem(list.name, item.text);
      service.toggleItem(list.name, item.text);

      const toggledItem = service.getListByName(list.name)?.items.find((i) => i.text === item.text);
      expect(toggledItem?.completed).toBe(false);
    });

    it('should persist after toggling', () => {
      const list = service.createList('Test');
      const item = service.addItem(list.name, 'Task');
      storageSpy.mockClear();

      service.toggleItem(list.name, item.text);

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('should remove the item from the list', () => {
      const list = service.createList('Test');
      const item = service.addItem(list.name, 'To Remove');

      service.deleteItem(list.name, item.text);

      const items = service.getListByName(list.name)?.items ?? [];
      expect(items).not.toContainEqual(expect.objectContaining({ text: item.text }));
    });

    it('should persist after deleting an item', () => {
      const list = service.createList('Test');
      const item = service.addItem(list.name, 'To Remove');
      storageSpy.mockClear();

      service.deleteItem(list.name, item.text);

      expect(storageSpy).toHaveBeenCalled();
    });
  });

  describe('hydration', () => {
    it('should load existing data from localStorage on construction', () => {
      const existingLists: TodoList[] = [
        {
          name: 'Pre-existing List',
          items: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ];
      localStorage.setItem('listify_lists', JSON.stringify(existingLists));

      // Re-create the service to trigger hydration
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(ListService);

      expect(freshService.lists()).toHaveLength(1);
      expect(freshService.lists()[0].name).toBe('Pre-existing List');
    });
  });
});
