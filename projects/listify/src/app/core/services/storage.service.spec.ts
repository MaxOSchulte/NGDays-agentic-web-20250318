import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { TodoList } from '../models/index';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return fallback when key does not exist', () => {
    const fallback = { items: [] };
    const result = service.load('nonexistent_key', fallback);
    expect(result).toEqual(fallback);
  });

  it('should save and load a typed object (roundtrip)', () => {
    const list: TodoList = {
      name: 'Test List',
      items: [{ text: 'Buy milk', completed: false, createdAt: '2026-01-01T00:00:00Z' }],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    service.save('test_key', list);
    const loaded = service.load<TodoList>('test_key', {} as TodoList);
    expect(loaded).toEqual(list);
  });

  it('should return true on successful save', () => {
    const result = service.save('key', { data: 'value' });
    expect(result).toBe(true);
  });

  it('should return false when localStorage quota is exceeded', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const result = service.save('key', { data: 'value' });
    expect(result).toBe(false);
  });

  it('should return fallback when stored JSON is corrupt', () => {
    localStorage.setItem('corrupt_key', '{invalid json!!!');
    const fallback = { safe: true };
    const result = service.load('corrupt_key', fallback);
    expect(result).toEqual(fallback);
  });

  it('should remove a key from localStorage', () => {
    localStorage.setItem('remove_key', '"data"');
    service.remove('remove_key');
    expect(localStorage.getItem('remove_key')).toBeNull();
  });

  it('should use separate keys for lists and chat', () => {
    expect(service.LISTS_KEY).toBe('listify_lists');
    expect(service.CHAT_KEY).toBe('listify_chat_history');
  });
});
