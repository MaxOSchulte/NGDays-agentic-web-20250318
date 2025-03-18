import { inject, Injectable, InjectionToken } from '@angular/core';
import OpenAI from 'openai';
import {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources';
import zodToJsonSchema from 'zod-to-json-schema';
import { AiToolOptions } from './ai-tool.decorator';

export const AI_BACKEND_CONFIG = new InjectionToken<AiBackendConfig>(
  'to configure an ai backend.'
);

export interface AiBackendConfig {
  model: string;
  baseURL: string;
  temperature: number;
  apiKey?: string;
}

export interface FunctionCallRequest {
  messages: ChatCompletionMessageParam[];
  tools: ChatCompletionTool[];
  tool_choice?: ChatCompletionCreateParams['tool_choice'];
}

export interface FunctionCallResponse {
  choices: ChatCompletion.Choice[];
  toolCalls?: OpenAI.ChatCompletionMessageToolCall[];
  isToolCall: boolean;
}

/**
 * Splits a function name into its base name and optional GUID.
 * @param functionName - The full function name.
 * @returns An object with the split name and optional GUID.
 */
export function splitFunctionName(name: string): {
  className: string;
  functionName: string;
} {
  const [className, functionName] = name.split('___');
  return { className, functionName };
}

/**
 * Merges a function name with an optional GUID.
 * @param className - The base function name.
 * @param functionName - Optional GUID to append.
 * @returns The merged function name.
 */
export function mergeFunctionName(
  className: string,
  functionName: string | number
): string {
  return `${className}___${functionName}`;
}

/**
 * Service for communicating with OpenAI API
 * Supports function calling and tool use capabilities
 */
@Injectable({ providedIn: 'root' })
export class AiBackendService {
  private config = inject<AiBackendConfig>(AI_BACKEND_CONFIG, {
    optional: true,
  });

  private openai = new OpenAI({
    apiKey: this.config?.apiKey ?? 'CHANGE API KEY',
    dangerouslyAllowBrowser: true, // Only use this in a secure environment
    baseURL: this.config?.baseURL,
  });

  /**
   * Creates a chat completion with optional function calling capabilities
   *
   * @param request Chat completion request with messages and optional tools
   * @param model Optional model override
   * @param temperature Optional temperature override
   * @returns Observable of the function call response
   */
  async prompt(
    request: FunctionCallRequest,
    model?: string,
    temperature?: number
  ): Promise<ChatCompletion.Choice[]> {
    const params: ChatCompletionCreateParams = {
      model: model ?? this.config?.model ?? 'gpt-4o-mini',
      messages: request.messages,
      temperature: temperature ?? this.config?.temperature ?? 0,
    };

    // Add tools and tool_choice if provided
    if (request.tools && request.tools.length > 0) {
      params.tools = request.tools;

      if (request.tool_choice) {
        params.tool_choice = request.tool_choice;
      }
    }

    const result = await this.openai.chat.completions.create(params);
    return result.choices;
  }

  /**
   * Helper method to execute a tool call and get a response
   *
   * @param toolCall The tool call to execute
   * @param availableTools Map of available tools by name
   * @returns Observable of the result
   */
  async executeToolCall(
    toolCall: OpenAI.ChatCompletionMessageToolCall,
    availableTools: Record<string, (args: any) => any>
  ): Promise<{
    toolCall: OpenAI.ChatCompletionMessageToolCall;
    result: any;
  }> {
    const toolName = toolCall.function.name;
    const toolFunction = availableTools[toolName];

    if (!toolFunction) {
      throw new Error(`Tool ${toolName} not found`);
    }

    // Parse arguments from tool call
    const args = JSON.parse(toolCall.function.arguments || '{}');

    // Execute the tool function and return result as observable
    const result = toolFunction(args);

    // Handle both promise-based and direct returns
    if (result instanceof Promise) {
      return { toolCall, result: await result };
    } else {
      return { toolCall, result };
    }
  }

  /**
   * Registers tools from a class instance
   *
   * @param instance Class instance containing tool methods
   * @returns Array of ChatCompletionTool objects
   */
  getToolsFromInstance(instance: Object): ChatCompletionTool[] {
    const tools: ChatCompletionTool[] = [];

    // Get all function properties
    const propertyNames = Object.getOwnPropertyNames(
      Object.getPrototypeOf(instance)
    );
    const className = instance.constructor.name;

    for (const prop of propertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(instance),
        prop
      );

      // Skip if not a function or if it's the constructor
      if (typeof descriptor?.value !== 'function' || prop === 'constructor') {
        continue;
      }

      // Check for AI tool metadata (assumes decorator or other metadata)
      const fn = descriptor.value;
      const metadata: AiToolOptions = (fn as any).__aiTool; // Property set by AiToolDecorator

      if (metadata) {
        tools.push({
          type: 'function',
          function: {
            name: mergeFunctionName(className, prop),
            description: metadata.description,
            parameters: zodToJsonSchema(metadata.parameters),
          },
        });
      }
    }

    return tools;
  }
}
