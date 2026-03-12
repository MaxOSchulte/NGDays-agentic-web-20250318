/**
 * AXE Accessibility Tests for Chat Components
 *
 * Runs axe-core against rendered component fixtures to catch WCAG 2.x AA violations.
 * Color-contrast is disabled because JSDOM does not compute styles.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import axe, { AxeResults } from 'axe-core';

import { PreviewCardComponent } from './preview-card/preview-card.component';
import { MessageListComponent } from './message-list/message-list.component';
import { ChatInputComponent } from './chat-input/chat-input.component';
import { ListService } from '../../../core/services/list.service';
import { ChatService } from '../../../core/services/chat.service';
import { AgUiService } from '../../../core/services/ag-ui.service';
import {
  PreviewChatMessage,
  TextChatMessage,
  ActionChatMessage,
  ChatMessage,
} from '../../../core/models/index';

// ── AXE helper ──────────────────────────────────────────────────────

const AXE_OPTIONS: axe.RunOptions = {
  rules: { 'color-contrast': { enabled: false } },
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
};

async function expectNoViolations(element: HTMLElement): Promise<void> {
  const results: AxeResults = await axe.run(element, AXE_OPTIONS);
  const violations = results.violations.map((v) => `[${v.id}] ${v.help} (${v.nodes.length} nodes)`);
  expect(violations).toEqual([]);
}

// ── PreviewCard: list exists ────────────────────────────────────────

describe('Accessibility: PreviewCardComponent (list exists)', () => {
  @Component({
    selector: 'test-preview-exists-host',
    imports: [PreviewCardComponent],
    template: `<app-preview-card [message]="message()" />`,
  })
  class HostComponent {
    readonly message = input.required<PreviewChatMessage>();
  }

  let fixture: ComponentFixture<HostComponent>;
  let listService: ListService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [{ provide: Router, useValue: { navigate: vi.fn() } }],
    });
    listService = TestBed.inject(ListService);
  });

  it('should have no AXE violations when list exists', async () => {
    const list = listService.createList('Groceries');
    listService.addItem(list.name, 'Milk');
    listService.addItem(list.name, 'Eggs');

    fixture = TestBed.createComponent(HostComponent);
    fixture.componentRef.setInput('message', {
      id: 'msg-a11y-1',
      type: 'preview',
      listName: list.name,
      timestamp: new Date().toISOString(),
    } satisfies PreviewChatMessage);
    fixture.detectChanges();

    await expectNoViolations(fixture.nativeElement);
  });
});

// ── PreviewCard: deleted list ───────────────────────────────────────

describe('Accessibility: PreviewCardComponent (deleted list)', () => {
  @Component({
    selector: 'test-preview-deleted-host',
    imports: [PreviewCardComponent],
    template: `<app-preview-card [message]="message()" />`,
  })
  class HostComponent {
    readonly message = input.required<PreviewChatMessage>();
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [{ provide: Router, useValue: { navigate: vi.fn() } }],
    });
  });

  it('should have no AXE violations when list is deleted', async () => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentRef.setInput('message', {
      id: 'msg-a11y-2',
      type: 'preview',
      listName: 'nonexistent-list',
      timestamp: new Date().toISOString(),
    } satisfies PreviewChatMessage);
    fixture.detectChanges();

    await expectNoViolations(fixture.nativeElement);
  });
});

// ── MessageListComponent ────────────────────────────────────────────

describe('Accessibility: MessageListComponent', () => {
  let fixture: ComponentFixture<MessageListComponent>;

  const mockMessages = signal<ChatMessage[]>([]);
  const mockIsProcessing = signal(false);
  const mockStreamingText = signal<string | null>(null);
  const mockError = signal(null);
  const mockHasMessages = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MessageListComponent, NoopAnimationsModule],
      providers: [
        {
          provide: ChatService,
          useValue: {
            messages: mockMessages,
            isProcessing: mockIsProcessing,
            streamingText: mockStreamingText,
            error: mockError,
            hasMessages: mockHasMessages,
          },
        },
        {
          provide: AgUiService,
          useValue: { retry: vi.fn() },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
  });

  afterEach(() => {
    mockMessages.set([]);
    mockIsProcessing.set(false);
    mockStreamingText.set(null);
    mockError.set(null);
    mockHasMessages.set(false);
  });

  it('should have no AXE violations with mixed message types', async () => {
    const messages: ChatMessage[] = [
      {
        id: 'u1',
        type: 'chat',
        role: 'user',
        content: 'Add milk to groceries',
        timestamp: new Date().toISOString(),
      } satisfies TextChatMessage,
      {
        id: 'a1',
        type: 'action',
        toolName: 'add_item',
        args: {},
        summary: 'Added milk to Groceries',
        timestamp: new Date().toISOString(),
      } satisfies ActionChatMessage,
      {
        id: 'bot1',
        type: 'chat',
        role: 'assistant',
        content: 'Done! I added milk to your Groceries list.',
        timestamp: new Date().toISOString(),
      } satisfies TextChatMessage,
    ];

    mockMessages.set(messages);
    mockHasMessages.set(true);

    fixture = TestBed.createComponent(MessageListComponent);
    fixture.detectChanges();

    await expectNoViolations(fixture.nativeElement);
  });

  it('should have no AXE violations in empty state', async () => {
    mockMessages.set([]);
    mockHasMessages.set(false);

    fixture = TestBed.createComponent(MessageListComponent);
    fixture.detectChanges();

    await expectNoViolations(fixture.nativeElement);
  });
});

// ── ChatInputComponent ──────────────────────────────────────────────

describe('Accessibility: ChatInputComponent', () => {
  let fixture: ComponentFixture<ChatInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChatInputComponent, NoopAnimationsModule],
    });
  });

  it('should have no AXE violations', async () => {
    fixture = TestBed.createComponent(ChatInputComponent);
    fixture.detectChanges();

    await expectNoViolations(fixture.nativeElement);
  });
});
