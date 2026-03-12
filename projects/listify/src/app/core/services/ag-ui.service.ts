import { HttpAgent } from '@ag-ui/client';
import { effect, inject, Injectable } from '@angular/core';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { ActionChatMessage, TodoList } from '../models/index';
import { ChatService } from './chat.service';
import { ConfirmationService } from './confirmation.service';
import { ListService } from './list.service';
import { ScreenType, ViewContextService } from './view-context.service';

const THREAD_ID_KEY = 'listify_thread_id';

/** Serialized list state sent to the AG-UI agent via the state field */
interface ListifyState {
  lists: Array<{
    name: string;
    items: Array<{
      text: string;
      completed: boolean;
      createdAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  currentScreen: ScreenType;
  currentListName: string | null;
}

/** Tools that destroy data — require confirmation */
const DESTRUCTIVE_TOOLS = new Set(['delete_list', 'delete_item']);

/** Tools that only read data — no mutation needed */
const READ_ONLY_TOOLS = new Set(['get_all_lists', 'get_list_details', 'search_items']);

@Injectable({ providedIn: 'root' })
export class AgUiService {
  private readonly chatService = inject(ChatService);
  private readonly listService = inject(ListService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly viewContext = inject(ViewContextService);
  private agent: HttpAgent;
  private threadId: string;

  /**
   * Tracks action cards created during the current run for grouping.
   * Key: groupKey (e.g. "add_item:listName"), Value: messageId
   */
  private currentRunActionCards = new Map<string, string>();

  /** Timestamp of the last proactive trigger to debounce rapid navigation */
  private lastProactiveTrigger = 0;
  private static readonly PROACTIVE_DEBOUNCE_MS = 2000;

  constructor() {
    let storedThreadId = localStorage.getItem(THREAD_ID_KEY);
    if (!storedThreadId) {
      storedThreadId = crypto.randomUUID();
      localStorage.setItem(THREAD_ID_KEY, storedThreadId);
    }
    this.threadId = storedThreadId;

    this.agent = new HttpAgent({
      url: environment.agentUrl,
      threadId: this.threadId,
    });

    // Proactive navigation triggers
    effect(() => {
      const screen = this.viewContext.currentScreen();
      const listName = this.viewContext.currentListName();

      if (screen !== 'list-detail' || !listName) return;
      if (this.chatService.isProcessing()) return;

      const now = Date.now();
      if (now - this.lastProactiveTrigger < AgUiService.PROACTIVE_DEBOUNCE_MS) return;

      const list = this.listService.getListByName(listName);
      if (!list) return;

      if (list.items.length === 0) {
        this.lastProactiveTrigger = now;
        this.sendProactiveMessage(listName, 'empty');
      } else if (list.items.every((i) => i.completed)) {
        this.lastProactiveTrigger = now;
        this.sendProactiveMessage(listName, 'all-complete');
      }
    });
  }

  resetThread(): void {
    const newThreadId = crypto.randomUUID();
    localStorage.setItem(THREAD_ID_KEY, newThreadId);
    this.threadId = newThreadId;
    this.agent = new HttpAgent({
      url: environment.agentUrl,
      threadId: newThreadId,
    });
    this.chatService.clearAll();
  }

  async sendMessage(content: string): Promise<void> {
    this.chatService.clearError();
    this.chatService.setProcessing(true);
    this.chatService.addUserMessage(content);

    try {
      await this.executeRunAgent(content);
    } catch {
      this.chatService.setError({
        message: 'Failed to connect to AI assistant',
        retryContent: content,
      });
      this.chatService.setProcessing(false);
    }
  }

  async retry(): Promise<void> {
    const error = this.chatService.error();
    if (error?.retryContent) {
      await this.sendMessage(error.retryContent);
    }
  }

  /**
   * Send a proactive message triggered by navigation context.
   * The system trigger is invisible — only the agent's response appears in chat.
   */
  private async sendProactiveMessage(
    listName: string,
    trigger: 'empty' | 'all-complete',
  ): Promise<void> {
    if (this.chatService.isProcessing()) return;

    const list = this.listService.getListByName(listName);
    if (!list) return;

    const systemMessage =
      trigger === 'empty'
        ? `[system:proactive] The user just navigated to list "${list.name}". It has no items. Send a brief, helpful suggestion.`
        : `[system:proactive] The user just navigated to list "${list.name}". All items are complete. Send a brief congratulatory message.`;

    try {
      await this.executeRunAgent(systemMessage);
    } catch {
      // Proactive suggestions are best-effort — silently fail
    }
  }

  /** Serialize current list state for the AG-UI state field */
  getListState(): ListifyState {
    return {
      lists: this.listService.lists().map((list: TodoList) => ({
        name: list.name,
        items: list.items.map((item) => ({
          text: item.text,
          completed: item.completed,
          createdAt: item.createdAt,
        })),
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      })),
      currentScreen: this.viewContext.currentScreen(),
      currentListName: this.viewContext.currentListName(),
    };
  }

  /**
   * Apply a non-destructive tool result to the local ListService.
   * Destructive actions (delete_list, delete_item) are queued but not auto-applied.
   */
  applyToolResult(toolName: string, args: Record<string, unknown>): void {
    switch (toolName) {
      case 'create_list': {
        const name = args['name'] as string;
        if (name) {
          this.listService.createList(name);
        }
        break;
      }
      case 'add_item': {
        const listName = args['list_name'] as string;
        const text = args['text'] as string;
        if (listName && text) {
          this.listService.addItem(listName, text);
        }
        break;
      }
      case 'mark_item_complete': {
        const listName = args['list_name'] as string;
        const itemName = args['item_name'] as string;
        if (listName && itemName) {
          this.listService.toggleItem(listName, itemName);
        }
        break;
      }
      case 'delete_list':
      case 'delete_item':
        // Handled by ConfirmationService via emitToolMessage — do not auto-apply
        break;
      default:
        // Read-only tools (get_all_lists, get_list_details, search_items) — no mutation needed
        break;
    }
  }

  /** @internal Exposed for testing — executes the AG-UI runAgent call */
  protected async executeRunAgent(content: string): Promise<void> {
    // Reset grouping for this run
    this.currentRunActionCards.clear();

    // Set current messages on the agent before each run
    const messages = this.chatService.getAgUiMessages();

    // Ensure at least one message for the backend.
    // Proactive triggers call executeRunAgent without adding a user message,
    // so inject content as a transient message when the array is empty.
    const agUiMessages =
      messages.length > 0
        ? messages
        : [{ id: crypto.randomUUID(), role: 'user' as const, content }];

    this.agent.setMessages(
      agUiMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    );

    // Set the current list state so it's sent with the AG-UI request
    this.agent.setState(this.getListState());

    await this.agent.runAgent(
      {
        runId: crypto.randomUUID(),
        tools: [
          { name: "invalidate", description: 'Invalidates a task when the user asks for it', parameters: z.object({ task: z.string() }).toJSONSchema() }
        ]
      },
      {
        onTextMessageContentEvent: ({ textMessageBuffer }) => {
          this.chatService.setStreaming(textMessageBuffer);
          // Reset grouping when text arrives — prevents merging tool calls separated by text
          this.currentRunActionCards.clear();
        },
        onTextMessageEndEvent: ({ textMessageBuffer }) => {
          this.chatService.addAssistantMessage(textMessageBuffer);
        },

        onToolCallStartEvent: (params) => console.log('TOOL CALL START', params),
        onToolCallEndEvent: ({ toolCallName, toolCallArgs }) => {
          console.log('TOOL CALL END', toolCallName, toolCallArgs);
          this.applyToolResult(toolCallName, toolCallArgs);
          this.emitToolMessage(toolCallName, toolCallArgs);
        },
        onRunErrorEvent: ({ event }) => {
          this.chatService.setError({
            message: (event as { message?: string }).message ?? 'Something went wrong',
            retryContent: content,
          });
          return { stopPropagation: true };
        },
        onRunFinishedEvent: () => {
          this.currentRunActionCards.clear();
          this.chatService.setProcessing(false);
        },
      },
    );
  }

  /**
   * Emit a chat message card for a tool call result.
   * Dispatches to the correct message type based on tool category.
   */
  private async emitToolMessage(toolName: string, args: Record<string, unknown>): Promise<void> {
    // Check for error in args
    if (args['error']) {
      this.chatService.addErrorActionMessage(toolName, String(args['error']));
      return;
    }

    if (DESTRUCTIVE_TOOLS.has(toolName)) {
      const summary = this.buildToolSummary(toolName, args);
      const msg = this.chatService.addConfirmMessage(
        toolName as 'delete_list' | 'delete_item',
        args,
        summary,
      );
      this.confirmationService.enqueue(msg);
      return;
    }

    if (READ_ONLY_TOOLS.has(toolName)) {
      // get_list_details with list_name → preview card instead of info chip
      if (toolName === 'get_list_details' && args['list_name']) {
        this.chatService.addPreviewMessage(args['list_name'] as string);
        return;
      }
      const summary = this.buildToolSummary(toolName, args);
      this.chatService.addInfoMessage(toolName, summary);
      return;
    }

    // Mutation (non-destructive) — check grouping
    const groupKey = this.getGroupKey(toolName, args);
    if (groupKey && this.currentRunActionCards.has(groupKey)) {
      const existingId = this.currentRunActionCards.get(groupKey)!;
      const existing = this.chatService.messages().find((m) => m.id === existingId) as
        | ActionChatMessage
        | undefined;
      if (existing) {
        const newCount = (existing.count ?? 1) + 1;
        const newSummary = this.buildGroupSummary(toolName, args, newCount);
        this.chatService.updateActionCardCount(existingId, newCount, newSummary);
        // Also emit preview card for add_item / mark_item_complete
        if ((toolName === 'add_item' || toolName === 'mark_item_complete') && args['list_name']) {
          this.chatService.addPreviewMessage(args['list_name'] as string);
        }
        return;
      }
    }

    // Create new action card
    const summary = this.buildToolSummary(toolName, args);
    const listName = (args['list_name'] as string) ?? undefined;
    const msg = this.chatService.addActionMessage(toolName, args, summary, listName);
    if (groupKey) {
      this.currentRunActionCards.set(groupKey, msg.id);
    }

    // Emit preview card alongside action card for add_item / mark_item_complete
    if ((toolName === 'add_item' || toolName === 'mark_item_complete') && listName) {
      this.chatService.addPreviewMessage(listName);
    }
  }

  /** Generate a human-readable summary for a tool call */
  private buildToolSummary(toolName: string, args: Record<string, unknown>): string {
    switch (toolName) {
      case 'create_list':
        return `Created list "${args['name']}"`;
      case 'add_item':
        return `Added "${args['text']}" to "${args['list_name']}"`;
      case 'mark_item_complete':
        return `Completed item in "${args['list_name']}"`;
      case 'delete_list': {
        const listName = args['list_name'] as string;
        const list = this.listService.getListByName(listName);
        if (list) {
          const completed = list.items.filter((i) => i.completed).length;
          return `Delete "${list.name}"? ${completed}/${list.items.length} items completed`;
        }
        return `Delete list?`;
      }
      case 'delete_item':
        return `Delete item from "${args['list_name']}"?`;
      case 'get_all_lists':
        return `Queried ${this.listService.lists().length} lists`;
      case 'get_list_details':
        return `Queried list "${args['list_name']}"`;
      case 'search_items':
        return 'Searched items';
      default:
        return `Executed ${toolName}`;
    }
  }

  /** Generate a summary for grouped action cards */
  private buildGroupSummary(
    toolName: string,
    args: Record<string, unknown>,
    count: number,
  ): string {
    const listName = args['list_name'] as string;
    switch (toolName) {
      case 'add_item':
        return `Added ${count} items to "${listName}"`;
      case 'mark_item_complete':
        return `Completed ${count} items in "${listName}"`;
      default:
        return `${count} ${toolName} actions`;
    }
  }

  /**
   * Get a grouping key for a tool call.
   * Returns null if the tool should not be grouped.
   */
  private getGroupKey(toolName: string, args: Record<string, unknown>): string | null {
    switch (toolName) {
      case 'add_item':
        return `add_item:${args['list_name']}`;
      case 'mark_item_complete':
        return `mark_complete:${args['list_name']}`;
      default:
        return null;
    }
  }
}
