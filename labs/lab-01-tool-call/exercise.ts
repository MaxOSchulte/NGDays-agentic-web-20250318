// =============================================================================
// Lab 01 — Your First Tool Call (OpenRouter + Zod)
// =============================================================================
//
// Goal: Send a chat completion to OpenRouter that triggers a tool call,
//       handle the tool response, and get the final answer from the LLM.
//
// You will:
//   1. Configure the OpenAI client to point at OpenRouter
//   2. Define two tools with Zod: get_weather(location) and navigate(page)
//   3. Send a message, handle the tool call, return a fake result
//   4. Print the LLM's final answer
//
// Prerequisites:
//   Add your key to labs/.env  →  OPENROUTER_API_KEY=sk-or-...
//
// Run:  npm run lab:01
// =============================================================================

import OpenAI from 'openai';
import { z } from 'zod';
import { zodFunction } from 'openai/helpers/zod';

// --- Configuration -----------------------------------------------------------
const OPENROUTER_API_KEY = process.env['OPENROUTER_API_KEY'] ?? '';
const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'openai/gpt-4o-mini';

if (!OPENROUTER_API_KEY) {
  console.error('Missing OPENROUTER_API_KEY — add it to labs/.env');
  process.exit(1);
}

// =============================================================================
// Step 1 — Create the OpenAI client pointing at OpenRouter
// =============================================================================
// TODO: new OpenAI({ baseURL: ..., apiKey: ... })

// =============================================================================
// Step 2 — Define your tool parameter schemas with Zod
// =============================================================================
// TODO: const GetWeatherParams = z.object({ location: z.string().describe('...') })
// TODO: const NavigateParams   = z.object({ page: z.string().describe('...') })

// =============================================================================
// Step 3 — Build the tools array using zodFunction()
// =============================================================================
// zodFunction() converts a Zod schema into the JSON-Schema the API expects.
//
// TODO: const tools = [
//   zodFunction({ name: 'get_weather', parameters: GetWeatherParams, description: '...' }),
//   zodFunction({ name: 'navigate',   parameters: NavigateParams,   description: '...' }),
// ];

// =============================================================================
// Step 4 — Simulate tool execution
// =============================================================================
// Return hardcoded fake results for each tool.
//
// TODO: function executeTool(name: string, args: Record<string, unknown>): string { ... }

// =============================================================================
// Step 5 — Main: send request, handle tool call, get final answer
// =============================================================================
async function main() {
  const userMessage = 'What is the weather in Berlin?';
  console.log(`\n> User: ${userMessage}\n`);

  // TODO: 1. Build `messages` array with one user message
  //
  // TODO: 2. Call client.chat.completions.create({ model, messages, tools })
  //
  // TODO: 3. Check response.choices[0].message.tool_calls
  //          - Log which tool was called and with what arguments
  //          - Call executeTool() to get a fake result
  //          - Append the assistant message AND a tool-result message:
  //            { role: 'tool', tool_call_id: '...', content: '...' }
  //          - Send a second request to get the final answer
  //
  // TODO: 4. Print the final assistant response
}

main().catch(console.error);
