/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DestroyRef,
  inject,
  Injectable,
  Injector,
  signal,
} from '@angular/core';
import {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index.mjs';
import { Subject } from 'rxjs';
import { SYSTEM_PROMPT } from '../public-api';
import {
  AiBackendService,
  splitFunctionName,
} from './backend/ai-backend.service';
import { DialogMessage, RegisterInfo } from './models';

/**
 * Registers an instance with the AI service.
 * @param info - A function that returns RegisterInfo for the instance.
 */
export function registerInstance(
  info: RegisterInfo,
  injector?: Injector,
): void {
  const aiService = injector?.get(AiService) ?? inject(AiService);
  const destroyRef = injector?.get(DestroyRef) ?? inject(DestroyRef);

  aiService.registerInstance(info);
  destroyRef.onDestroy(() => aiService.removeInstance(info));
}

export function unregisterInstance(
  info: RegisterInfo,
  injector?: Injector,
): void {
  const aiService = injector?.get(AiService) ?? inject(AiService);
  aiService.removeInstance(info);
}

/**
 * Creates a tool name by combining the class name and function name.
 * If the class name starts with an underscore, it is removed.
 * @param cl - The class constructor function
 * @param fn - The member function
 * @returns A string in the format "ClassName.functionName"
 */
export function createToolName(cl: Function, fn: Function): string {
  const className = cl.name.startsWith('_') ? cl.name.substring(1) : cl.name;
  return `${className}.${fn.name}`;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly aiBackendService = inject(AiBackendService);
  message$ = new Subject<DialogMessage>();
  automationRunning = signal(false);
  private registeredInstances = signal<RegisterInfo[]>([]);

  /**
   * Registers an instance with the service.
   * @param info - A function that returns RegisterInfo for the instance.
   */
  registerInstance(info: RegisterInfo): void {
    this.registeredInstances.update((instances) => [...instances, info]);
  }

  /**
   * Removes a registered instance from the service.
   * @param info - The function that was used to register the instance.
   */
  removeInstance(info: RegisterInfo): void {
    const idx = this.registeredInstances().findIndex((fn) => fn === info);

    if (idx > -1) {
      this.registeredInstances.update((instances) =>
        instances.filter((_, i) => i !== idx),
      );
    }
  }

  /**
   * Automates a process based on a user query.
   * @param userQuery - The query string from the user.
   */
  async automate(
    userQuery: string,
    history: ChatCompletionMessageParam[] = [],
  ): Promise<void> {
    this.automationRunning.set(true);

    // user message
    const message = {
      role: 'user',
      content: userQuery,
    } as ChatCompletionMessageParam;
    // make backend request, choices that the model makes
    // messages and tool calls
    //
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content:
          'META INFORMATION: ' +
          JSON.stringify(
            this.registeredInstances().map(
              ({ metaInfo }) => metaInfo?.() ?? '',
            ),
          ),
      },
      {
        role: 'system',
        content:
          'STATE INFORMATION: ' +
          JSON.stringify(
            this.registeredInstances().map(({ state }) => state?.() ?? ''),
          ),
      },

      ...history,
      message,
    ];
    const tools = this.registeredInstances().flatMap(({ instance }) =>
      this.aiBackendService.getToolsFromInstance(instance),
    );
    const choices = await this.aiBackendService.prompt({ messages, tools });

    for (const choice of choices) {
      this.handleChoice(choice, [message], tools);
    }
  }

  private async handleToolCalls({
    message,
  }: Pick<ChatCompletion.Choice, 'message'>): Promise<
    ChatCompletionToolMessageParam[]
  > {
    // iterate through tool calls in choices.
    const toolMap = this.getToolMap(
      message.tool_calls!,
      this.registeredInstances(),
    );
    return Promise.all(
      message.tool_calls!.map(async (call) => {
        try {
          const result = await this.aiBackendService.executeToolCall(
            call,
            toolMap,
          );

          const content = result !== undefined ? JSON.stringify(result) : '';
          const { className, functionName } = splitFunctionName(
            call.function.name,
          );

          // Notify about successful execution
          this.message$.next({
            role: 'tool',
            timestamp: new Date(),
            message: `[Tool] ${className}.${functionName}`,
          });

          return {
            content,
            tool_call_id: call.id,
            role: 'tool',
            name: call.function.name,
          };
        } catch (error: unknown) {
          // Handle errors gracefully
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(`Tool execution failed: ${errorMessage}`);

          this.message$.next({
            role: 'tool',
            message: `[Error] ${call.function.name}`,
            extended: `Tool execution failed: ${errorMessage}`,
            timestamp: new Date(),
          });

          return {
            content: '',
            tool_call_id: call.id,
            role: 'tool',
            name: call.function.name,
          };
        }
      }),
    );
  }

  private async handleChoice(
    choice: ChatCompletion.Choice,
    chat: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[],
  ): Promise<void> {
    // handle tool call, can be one or more
    if (choice.finish_reason === 'tool_calls') {
      // make the actual function call and create a message from it
      const toolResult = this.handleToolCalls(choice);

      // respond to the API with made calls
      if (toolResult) {
        chat.push(choice.message, ...(await toolResult));
        (await this.aiBackendService.prompt({ messages: chat, tools })).map(
          (choice) => this.handleChoice(choice, chat, tools),
        );
      }
    } else {
      this.message$.next({
        role: choice.message.role,
        message: choice.message.content ?? 'NO MESSAGE',
        source: choice.message,
        timestamp: new Date(),
      });
      this.automationRunning.set(false);
    }
  }

  private getToolMap(
    tools: ChatCompletionTool[],
    instances: RegisterInfo<unknown>[],
  ) {
    return Object.fromEntries(
      tools.map((tool) => {
        const { className, functionName } = splitFunctionName(
          tool.function.name,
        );
        const registeredInfo = instances.find(
          ({ className: instanceClassName }) => instanceClassName === className,
        );

        // @ts-ignore
        const toolFunction = registeredInfo?.instance[functionName];

        if (!toolFunction) {
          throw new Error(
            `Function ${functionName} not found in instance of ${registeredInfo?.className}`,
          );
        }

        if (typeof toolFunction !== 'function') {
          throw new Error(
            `${functionName} is not a function in instance of ${registeredInfo?.className}`,
          );
        }
        if (!registeredInfo) {
          return ['', () => console.log('NOTING')];
        }
        return [
          tool.function.name,
          (args: any) => toolFunction.apply(registeredInfo.instance, [args]),
        ];
      }),
    );
  }
}
