import 'reflect-metadata';
import { z, ZodSchema } from 'zod';

export interface AiToolOptions {
  description: string;
  parameters: ZodSchema;
}

/**
 * Decorator for marking methods as AI tools that can be used with function calling
 *
 * @param options Tool options including description and JSON schema parameters
 * @returns Method decorator
 */
export function AiTool(options: Partial<AiToolOptions>): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // Store the AI tool metadata on the method
    const method = descriptor.value;

    console.log('TOOL options', options);
    if (!options.parameters) {
      options.parameters = z.object({});
    }
    (method as any).__aiTool = options;

    // Return the descriptor with the original method
    return descriptor;
  };
}
