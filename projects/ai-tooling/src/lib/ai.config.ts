import type { AiBackendConfig } from './backend/ai-backend.service';

export const AiConfigurations = {
  OpenAi: {
    temperature: 0,
    baseURL: 'http://localhost:4200/openaiAutomation',
    model: 'gpt-4o-mini',
  } as AiBackendConfig,

  OpenRouter: {
    temperature: 0,
    baseURL: 'http://localhost:4200/openaiAutomation',
    model: 'gpt-4o-mini',
  } as AiBackendConfig,

  Ollama: {
    temperature: 0,
    baseURL: 'http://localhost:4200/ollamaAutomamtion',
    langfuseBaseURL: 'http://localhost:3000/langfuse',
    model: 'llama3.1:latest',
    streaming: false,
    //model: 'llama3.1:70b
    //transformOutput: (input: { message: Choice }) => [
    //    { message: input.message, finish_reason: 'tool_calls', index: 0 },
    //],
  } as AiBackendConfig,
} as const;
