import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { ViewContextService, ScreenType } from './view-context.service';

describe('ViewContextService', () => {
  let service: ViewContextService;
  let routerEvents$: Subject<RouterEvent>;
  let router: Router;

  beforeEach(() => {
    routerEvents$ = new Subject<RouterEvent>();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            events: routerEvents$.asObservable(),
          },
        },
      ],
    });

    service = TestBed.inject(ViewContextService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial state of chat screen with null listName', () => {
    expect(service.currentScreen()).toBe('chat');
    expect(service.currentListName()).toBeNull();
  });

  it('should set currentScreen to chat when navigating to /chat', () => {
    routerEvents$.next(new NavigationEnd(1, '/chat', '/chat'));

    expect(service.currentScreen()).toBe('chat');
    expect(service.currentListName()).toBeNull();
  });

  it('should set currentScreen to all-lists when navigating to /tasks', () => {
    routerEvents$.next(new NavigationEnd(2, '/tasks', '/tasks'));

    expect(service.currentScreen()).toBe('all-lists');
    expect(service.currentListName()).toBeNull();
  });

  it('should set currentScreen to list-detail when navigating to /tasks/Groceries', () => {
    routerEvents$.next(new NavigationEnd(3, '/tasks/Groceries', '/tasks/Groceries'));

    expect(service.currentScreen()).toBe('list-detail');
    expect(service.currentListName()).toBe('Groceries');
  });

  it('should decode URL-encoded list names', () => {
    routerEvents$.next(new NavigationEnd(3, '/tasks/My%20List', '/tasks/My%20List'));

    expect(service.currentScreen()).toBe('list-detail');
    expect(service.currentListName()).toBe('My List');
  });

  it('should update when navigating between routes', () => {
    routerEvents$.next(new NavigationEnd(1, '/tasks/Groceries', '/tasks/Groceries'));
    expect(service.currentScreen()).toBe('list-detail');
    expect(service.currentListName()).toBe('Groceries');

    routerEvents$.next(new NavigationEnd(2, '/tasks', '/tasks'));
    expect(service.currentScreen()).toBe('all-lists');
    expect(service.currentListName()).toBeNull();

    routerEvents$.next(new NavigationEnd(3, '/chat', '/chat'));
    expect(service.currentScreen()).toBe('chat');
    expect(service.currentListName()).toBeNull();
  });

  it('should use urlAfterRedirects for route parsing', () => {
    routerEvents$.next(new NavigationEnd(1, '/', '/chat'));

    expect(service.currentScreen()).toBe('chat');
  });

  it('should handle list names with special characters', () => {
    routerEvents$.next(
      new NavigationEnd(1, '/tasks/Work%20%26%20Personal', '/tasks/Work%20%26%20Personal'),
    );

    expect(service.currentScreen()).toBe('list-detail');
    expect(service.currentListName()).toBe('Work & Personal');
  });
});
