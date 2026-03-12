import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

export type ScreenType = 'chat' | 'all-lists' | 'list-detail';

@Injectable({ providedIn: 'root' })
export class ViewContextService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _currentScreen = signal<ScreenType>('chat');
  private readonly _currentListName = signal<string | null>(null);

  readonly currentScreen = this._currentScreen.asReadonly();
  readonly currentListName = this._currentListName.asReadonly();

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.parseUrl(event.urlAfterRedirects);
      });
  }

  private parseUrl(url: string): void {
    if (url.startsWith('/tasks/')) {
      this._currentScreen.set('list-detail');
      this._currentListName.set(decodeURIComponent(url.split('/tasks/')[1]));
    } else if (url.startsWith('/tasks')) {
      this._currentScreen.set('all-lists');
      this._currentListName.set(null);
    } else {
      this._currentScreen.set('chat');
      this._currentListName.set(null);
    }
  }
}
