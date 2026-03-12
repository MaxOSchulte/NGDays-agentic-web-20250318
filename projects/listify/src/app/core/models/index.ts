export interface TodoItem {
  text: string;
  completed: boolean;
  createdAt: string; // ISO 8601
}

export interface TodoList {
  name: string;
  items: TodoItem[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ChatError {
  message: string;
  retryContent?: string;
}

// ── ChatMessage discriminated union ──────────────────────────────────

export type ChatMessageType = 'chat' | 'action' | 'confirm' | 'info' | 'error-action' | 'preview';

interface BaseChatMessage {
  id: string;
  timestamp: string; // ISO 8601
}

export interface TextChatMessage extends BaseChatMessage {
  type: 'chat';
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'sent' | 'error';
}

export interface ActionChatMessage extends BaseChatMessage {
  type: 'action';
  toolName: string;
  args: Record<string, unknown>;
  summary: string;
  listName?: string;
  count?: number;
}

export interface ConfirmChatMessage extends BaseChatMessage {
  type: 'confirm';
  toolName: 'delete_list' | 'delete_item';
  args: Record<string, unknown>;
  summary: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface InfoChatMessage extends BaseChatMessage {
  type: 'info';
  toolName: string;
  summary: string;
}

export interface ErrorActionMessage extends BaseChatMessage {
  type: 'error-action';
  toolName: string;
  summary: string;
}

export interface PreviewChatMessage extends BaseChatMessage {
  type: 'preview';
  listName: string;
}

export type ChatMessage =
  | TextChatMessage
  | ActionChatMessage
  | ConfirmChatMessage
  | InfoChatMessage
  | ErrorActionMessage
  | PreviewChatMessage;
