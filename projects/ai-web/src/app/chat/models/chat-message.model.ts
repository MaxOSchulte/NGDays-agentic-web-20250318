import {
  ChatCompletionMessageParam,
  ChatCompletionRole,
} from 'openai/resources/index.mjs';

export interface DialogMessage {
  role: ChatCompletionRole;
  message: string;
  extended?: string;
  expanded?: boolean;
  data?: unknown;
  timestamp: Date;
  source?: ChatCompletionMessageParam;
}
