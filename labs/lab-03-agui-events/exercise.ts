// =============================================================================
// Lab 03 — AG-UI Event Stream
// =============================================================================
//
// Goal: Connect to a running AG-UI backend, send a user message, and log
//       every event that comes back over the stream.
//
// Prerequisites:
//   Start the agent backend first:  npm run dev:agent
//   The backend must be reachable at AGENT_URL below.
//
// You will:
//   1. Create an HttpAgent from @ag-ui/client
//   2. Set an initial user message on the agent
//   3. Call runAgent() and log every event type to the console
//
// Run:  npm run lab:03
// =============================================================================

import { HttpAgent } from '@ag-ui/client';

// --- Configuration (change if your agent runs elsewhere) ---------------------
const AGENT_URL = 'http://localhost:4111/agui';

// =============================================================================
// Step 1 — Create the HttpAgent
// =============================================================================
// TODO: Create a new HttpAgent with `url` and a random `threadId`.
//       Use crypto.randomUUID() for the threadId.
//
// const agent = new HttpAgent({ url: AGENT_URL, threadId: ... });

// =============================================================================
// Step 2 — Set the initial message
// =============================================================================
// TODO: Call agent.setMessages([...]) with one user message.
//       Each message needs: { id: string, role: 'user', content: string }

// =============================================================================
// Step 3 — Run the agent and log all events
// =============================================================================
async function main() {
  const userMessage = 'Hello, what can you help me with?';
  console.log(`\n> User: ${userMessage}\n`);

  // TODO: Call agent.runAgent() with two arguments:
  //
  //   1st arg — run config:
  //     { runId: crypto.randomUUID() }
  //
  //   2nd arg — event handlers object:
  //     onTextMessageContentEvent  — log the textMessageBuffer
  //     onTextMessageEndEvent      — log "=== MESSAGE END ==="
  //     onToolCallStartEvent       — log the params
  //     onToolCallEndEvent         — log toolCallName + toolCallArgs
  //     onRunErrorEvent            — log the error event
  //     onRunFinishedEvent         — log "=== RUN FINISHED ==="

  console.log('\nDone.');
}

main().catch(console.error);
