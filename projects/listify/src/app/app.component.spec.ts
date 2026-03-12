import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { App } from './app.component';
import { ChatComponent } from './features/chat/chat.component';

@Component({ selector: 'app-chat', template: '' })
class MockChatComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideAnimationsAsync()],
    })
      .overrideComponent(App, {
        remove: { imports: [ChatComponent] },
        add: { imports: [MockChatComponent] },
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
