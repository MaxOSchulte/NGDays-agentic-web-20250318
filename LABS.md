1. Replace the `OPENROUTER_API_KEY` in `.env` with an actual key.
2. Run `npm run start` to Start the app and a proxy for handling the API calls.

# LAB 1 - Prompting

Open `lab-openai.ts` file and experiment with the prompt / message API.
You can test your code by running `npm run lab:openai`;

# LAB 2 - Tools

Use this function with tool calling

````Typescript
  { type: 'function',
    function: {
    "name": "get_weather",
    "description": "Determine weather in my location",
    "strict": true,
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city and state e.g. San Francisco, CA"
        },
        "unit": {
          "type": "string",
          "enum": [
            "c",
            "f"
          ]
        }
      },
      "additionalProperties": false,
      "required": [
        "location",
        "unit"
      ]
    }
  }
}

```

# Lab 3 - Using Zod
https://zod.dev/

Open `zod-lab.ts` and create a Schema and verify it with different objects.
You can test your code by running `npm run lab:zod`;

```typescript

const TargetSchema = z.object({
  targetId: z.string().describe('ID of the target that should be clicked.'),
});

// use parse to verify
// -> TargetSchema.parse({targetId: 'test123'}) // Throws Error on mismatch
// -> TargetSchema.safeParse({targetId: 'test123'}) // Returns Object on mismatch

````

# LAB 4 - Custom Tools

Create your own tool definition in `lab-openai.ts`.

# LAB 5 - Calling Custom Tools

Implement a function defined in `LAB 4` and call it with the result of the prompt.

# LAB 6 - Creating Agentic Web Apps

Discuss with me what features you want to see in an Agentic-Web-App and we implement it.
