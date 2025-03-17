import type { AiBackendConfig } from './backend/ai-backend.service';

export const AiConfigurations = {
    // FIX alternativ backend service, claude does not support OpenAi-API
    Claude: {
        temperature: 0,
        baseURL: 'http://localhost:4200/claudeAutomation',
        langfuseBaseURL: 'http://localhost:4200/langfuse',
        model: 'claude-3-5-sonnet-20240620',
    } as AiBackendConfig,

    Groq: {
        temperature: 0,
        baseURL: 'http://localhost:4200/groqAutomation',
        langfuseBaseURL: 'http://localhost:4200/langfuse',
        model: 'llama3-groq-8b-8192-tool-use-preview',
        // model: 'llama3-groq-70b-8192-tool-use-preview',
        // model: 'llama3-70b-8192',
        // model: 'mixtral-8x7b-32768',
    } as AiBackendConfig,

    OpenAi: {
        temperature: 0,
        baseURL: 'http://localhost:4200/openaiAutomation',
        langfuseBaseURL: 'http://localhost:4200/langfuse',
        model: 'gpt-4o',
    } as AiBackendConfig,

    // FIX alternativ backend service, ollama subtly diverts from OpenAi-API
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
