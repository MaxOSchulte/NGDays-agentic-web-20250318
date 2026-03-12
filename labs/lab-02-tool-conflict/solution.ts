// =============================================================================
// Lab 02 — Solution
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

const client = new OpenAI({ baseURL: BASE_URL, apiKey: OPENROUTER_API_KEY });

// --- Schemas -----------------------------------------------------------------
const NavigateParams = z.object({
  page: z.string().describe('Target page name'),
});

const DisplayParams = z.object({
  id: z.string().describe('Item ID to display'),
});

// Step 1 — Vague descriptions (intentionally bad)
const vagueTools = [
  zodFunction({
    name: 'navigate',
    parameters: NavigateParams,
    description: 'Show something to the user',
  }),
  zodFunction({
    name: 'display',
    parameters: DisplayParams,
    description: 'Show some information',
  }),
];

// Step 2 — Precise descriptions
const preciseTools = [
  zodFunction({
    name: 'navigate',
    parameters: NavigateParams,
    description:
      'Change the current view to a different page in the web application. ' +
      'Use this ONLY for page navigation (e.g. dashboard, settings, profile). ' +
      'The page parameter is a page name, NOT a data ID.',
  }),
  zodFunction({
    name: 'display',
    parameters: DisplayParams,
    description:
      'Retrieve and show detailed data for a specific record by its numeric ID. ' +
      'Use this when the user wants to look up a specific item, user, or entity. ' +
      'The id parameter must be an identifier like "42" or "7".',
  }),
];

// Step 3 — Test prompts
const testPrompts = [
  'Show me the dashboard',
  'Show me item 42',
  'Display the settings page',
  'I want to see user 7',
  'Take me to the profile page',
];

// Step 4 — Helper
async function callWithTools(
  message: string,
  tools: OpenAI.ChatCompletionTool[],
): Promise<{ toolName: string; args: Record<string, unknown> } | null> {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: message }],
    tools,
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall) return null;

  return {
    toolName: toolCall.function.name,
    args: JSON.parse(toolCall.function.arguments),
  };
}

// Step 5 — Compare
async function main() {
  console.log('=== VAGUE descriptions ===\n');
  for (const prompt of testPrompts) {
    const result = await callWithTools(prompt, vagueTools);
    const call = result ? `${result.toolName}(${JSON.stringify(result.args)})` : 'no tool called';
    console.log(`  "${prompt}"\n    -> ${call}\n`);
  }

  console.log('\n=== PRECISE descriptions ===\n');
  for (const prompt of testPrompts) {
    const result = await callWithTools(prompt, preciseTools);
    const call = result ? `${result.toolName}(${JSON.stringify(result.args)})` : 'no tool called';
    console.log(`  "${prompt}"\n    -> ${call}\n`);
  }
}

main().catch(console.error);
