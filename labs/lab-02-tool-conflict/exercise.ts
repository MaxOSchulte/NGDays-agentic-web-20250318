// =============================================================================
// Lab 02 — Tool Description Conflicts
// =============================================================================
//
// Goal: Observe how vague or overlapping tool descriptions cause the LLM to
//       pick the WRONG tool, then fix the descriptions and compare.
//
// Scenario:
//   Two tools:
//     navigate(page) — change the current view in the app
//     display(id)    — show detailed data for a specific record
//
//   Both could be interpreted as "showing" something. With poor descriptions
//   the LLM will confuse them on ambiguous prompts.
//
// You will:
//   1. Define both tools with intentionally vague descriptions
//   2. Run several ambiguous prompts — observe which tool gets called
//   3. Rewrite the descriptions to be precise
//   4. Run the same prompts again — compare
//
// Run:  npm run lab:02
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

// --- Schemas (these stay the same for both rounds) ---------------------------
const NavigateParams = z.object({
  page: z.string().describe('Target page name'),
});

const DisplayParams = z.object({
  id: z.string().describe('Item ID to display'),
});

// =============================================================================
// Step 1 — Define tools with VAGUE descriptions (intentionally bad)
// =============================================================================
// TODO: Create `vagueTools` — use short, overlapping descriptions that could
//       apply to either tool. E.g. "Show something to the user".
//
// const vagueTools = [ ... ];

// =============================================================================
// Step 2 — Define the SAME tools with PRECISE descriptions
// =============================================================================
// TODO: Create `preciseTools` — make each description unambiguous about
//       WHEN and WHY the tool should be used. Include what the parameter means.
//
// const preciseTools = [ ... ];

// =============================================================================
// Step 3 — Test prompts (some are intentionally ambiguous)
// =============================================================================
const testPrompts = [
  'Show me the dashboard',
  'Show me item 42',
  'Display the settings page',
  'I want to see user 7',
  'Take me to the profile page',
];

// =============================================================================
// Step 4 — Helper: send one message and return which tool was picked
// =============================================================================
async function callWithTools(
  message: string,
  tools: OpenAI.ChatCompletionTool[],
): Promise<{ toolName: string; args: Record<string, unknown> } | null> {
  // TODO: Call client.chat.completions.create with model, one user message, tools
  // TODO: Return { toolName, args } from the first tool_call, or null
  return null;
}

// =============================================================================
// Step 5 — Run both rounds and compare
// =============================================================================
async function main() {
  console.log('=== VAGUE descriptions ===\n');
  for (const prompt of testPrompts) {
    // TODO: call callWithTools(prompt, vagueTools) and log the result
  }

  console.log('\n=== PRECISE descriptions ===\n');
  for (const prompt of testPrompts) {
    // TODO: call callWithTools(prompt, preciseTools) and log the result
  }

  // Observe: which prompts triggered the wrong tool in the vague round?
  // Did precise descriptions fix them?
}

main().catch(console.error);
