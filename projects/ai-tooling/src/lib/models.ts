import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

/**
 * Represents a message in the dialog system.
 * Used for communication between the AI service and UI components.
 */
export interface DialogMessage {
  /**
   * The role of the message sender (e.g., 'user', 'assistant', 'tool')
   */
  role: ChatCompletionMessageParam['role'];

  /**
   * The content of the message
   */
  message: string;

  /**
   * Timestamp when the message was created
   */
  timestamp: Date;

  /**
   * Optional extended information about the message
   * Typically used for error details or additional context
   */
  extended?: string;

  /**
   * Optional source of the message, typically the original message object
   * from the API when applicable
   */
  source?: ChatCompletionMessageParam;
}

/**
 * Information required to register an instance with the AI service.
 * @template T - The type of the instance being registered
 */
export interface RegisterInfo<T = unknown> {
  /**
   * The instance being registered
   */
  instance: object;

  /**
   * The class name of the instance
   */
  className: string;

  /**
   * Optional function that returns metadata about the instance
   * Used to provide additional context to the AI
   */
  metaInfo?: () => string;

  /**
   * Optional function that returns the current state of the instance
   * Used to provide state information to the AI
   */
  state?: () => string;
}
