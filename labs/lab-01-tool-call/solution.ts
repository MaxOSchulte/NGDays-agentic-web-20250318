// =============================================================================
// Lab 01 — Solution
// =============================================================================

import OpenAI from 'openai';
import { FunctionTool } from 'openai/resources/beta/assistants.mjs';
import { z } from 'zod';

// --- Configuration -----------------------------------------------------------
const OPENROUTER_API_KEY = process.env['OPENROUTER_API_KEY'] ?? '';
const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'openai/gpt-4o-mini';

if (!OPENROUTER_API_KEY) {
  console.error('Missing OPENROUTER_API_KEY — add it to labs/.env');
  process.exit(1);
}

// Step 1 — Client
const client = new OpenAI({ baseURL: BASE_URL, apiKey: OPENROUTER_API_KEY });

// Step 2 — Zod schemas
const GetWeatherParams = z.object({
  location: z.string().describe('City name, e.g. "Berlin"'),
});

const NavigateParams = z.object({
  page: z.string().describe('Page name to navigate to, e.g. "settings"'),
});

// Step 3 — Tools
const tools: FunctionTool[] = [
  {
    type: 'function',

    function: {
      name: 'get_weather', description: 'get weather', strict: false, parameters: z.object().toJSONSchema()
    }

  },
  // zodFunction({
  //   name: 'get_weather',
  //   parameters: GetWeatherParams,
  //   description: 'Get the current weather for a given city',
  // }),
  // zodFunction({
  //   name: 'navigate',
  //   parameters: NavigateParams,
  //   description: 'Navigate the web application to a specific page',
  // }),
];

// Step 4 — Simulate
function executeTool(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'get_weather':
      return `Weather in ${args['location']}: 22°C, partly cloudy`;
    case 'navigate':
      return `Navigated to page: ${args['page']}`;
    default:
      return `Unknown tool: ${name}`;
  }
}

// Step 5 — Main
async function main() {
  const userMessage = 'What is the weather in Berlin?';
  console.log(`\n> User: ${userMessage}\n`);

  const messages: OpenAI.ChatCompletionMessageParam[] = [{ role: 'user', content: userMessage }];

  // First request — may produce a tool call
  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    tools,
  });

  const choice = response.choices[0];

  if (choice.message.tool_calls?.length) {
    const toolCall = choice.message.tool_calls[0];
    const args = JSON.parse(toolCall.function.arguments);

    console.log(`  Tool called: ${toolCall.function.name}(${JSON.stringify(args)})`);

    const result = executeTool(toolCall.function.name, args);
    console.log(`  Tool result: ${result}\n`);

    // Append assistant message (with tool_calls) and the tool result
    messages.push(choice.message);
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: result,
    });

    // Second request — LLM incorporates the tool result into its answer
    const finalResponse = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools,
    });

    console.log(`> Assistant: ${finalResponse.choices[0].message.content}`);
  } else {
    console.log(`> Assistant: ${choice.message.content}`);
  }
}

main().catch(console.error);
