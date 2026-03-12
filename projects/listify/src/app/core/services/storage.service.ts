import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly LISTS_KEY = 'listify_lists';
  readonly CHAT_KEY = 'listify_chat_history';

  load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  save<T>(key: string, data: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
