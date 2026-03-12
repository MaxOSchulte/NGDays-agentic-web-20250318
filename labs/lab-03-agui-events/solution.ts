// =============================================================================
// Lab 03 — Solution
// =============================================================================

import { HttpAgent } from '@ag-ui/client';

// --- Configuration -----------------------------------------------------------
const AGENT_URL = 'http://localhost:4111/agui';

// Step 1 — Create the agent
const agent = new HttpAgent({
  url: AGENT_URL,
  threadId: crypto.randomUUID(),
});

// Step 3 — Run and log
async function main() {
  const userMessage = 'Hello, what can you help me with?';
  console.log(`\n> User: ${userMessage}\n`);

  // Step 2 — Set initial message
  agent.setMessages([{ id: crypto.randomUUID(), role: 'user', content: userMessage }]);

  await agent.runAgent(
    { runId: crypto.randomUUID() },
    {
      onTextMessageContentEvent: ({ textMessageBuffer }) => {
        process.stdout.write(`\r[TEXT] ${textMessageBuffer}`);
      },
      onTextMessageEndEvent: ({ textMessageBuffer }) => {
        console.log(`\n\n=== MESSAGE END ===`);
        console.log(`> Assistant: ${textMessageBuffer}`);
      },
      onToolCallStartEvent: (params) => {
        console.log('[TOOL START]', params);
      },
      onToolCallEndEvent: ({ toolCallName, toolCallArgs }) => {
        console.log('[TOOL END]', toolCallName, toolCallArgs);
      },
      onRunErrorEvent: ({ event }) => {
        console.error('[ERROR]', event);
      },
      onRunFinishedEvent: () => {
        console.log('\n=== RUN FINISHED ===');
      },
    },
  );

  console.log('\nDone.');
}

main().catch(console.error);
