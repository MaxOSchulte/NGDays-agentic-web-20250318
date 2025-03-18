# AI Agent Demo

This project demonstrates how to build AI-enhanced applications using Angular v19+, with a focus on agentic AI capabilities for teaching purposes.

## Overview

AI Agent Demo showcases practical implementations of AI agents within web applications, combining modern Angular architecture with powerful AI services. This project serves as a learning resource to understand how AI can enhance user interfaces and application functionality through directives, services, and reactive patterns.

## Disclaimer

**Note:** Parts of the ai-web application in this project were generated using generative AI tools. This approach demonstrates how AI can be leveraged not only as a feature within applications but also as a development accelerator in the creation process itself.

===This demo application is no guide or reference for good and modern Angular development. This is just for demonstration purposes on how to integrate AI-features.

## Project Structure

The project consists of two main parts:

1. **AI Tooling Library** (`projects/ai-tooling`): Reusable components for AI integration

   - Core services for AI communication
   - Directives for AI-enhanced UI elements
   - TypeScript decorators for AI tool definitions
   - Configuration interfaces and models

2. **AI Web Application** (`projects/ai-web`): Demo application showcasing the AI capabilities
   - Chat interface with AI-powered messaging
   - Todo application with AI assistance
   - Example implementations of AI directives

## Key AI Features

### Agentic AI Capabilities

This demo implements several agentic AI patterns that allow the AI to:

- **Understand Context**: By analyzing user behavior and application state
- **Take Actions**: By triggering functions or suggesting next steps
- **Learn From Interactions**: By storing and retrieving interaction patterns
- **Make Decisions**: By evaluating application data and user intent

### AI Service Architecture

The core `AiService` provides a foundation for AI capabilities with:

- Configurable AI endpoints and models
- Request/response management with streaming support
- Context handling for stateful conversations
- Function calling capabilities through tool definitions
- Error handling and retry mechanisms

### UI Integration

The project demonstrates practical implementations of:

- **AI-powered click directives**: Enhance elements with intelligent behavior
- **AI-assisted scrolling**: Provide context-aware scrolling recommendations
- **Conversational UI**: A fully-functional chat interface with the AI agent
- **Tool-using AI integration**: AI that can call application functions

### Todo Application with AI Features

The Todo application showcases:

- AI-assisted task creation
- Smart categorization of tasks
- Contextual recommendations based on user patterns

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Angular CLI (v19 or higher)
- OpenAI API key (for AI functionality)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ai-agent-demo
```

2. Create your environment configuration:

```bash
cp .env.example .env
```

3. Add your OpenAI API key to the `.env` file:

```
OPENAI_API_KEY=your-api-key-here
```

4. Install dependencies and start the development server:

```bash
# Install dependencies
npm install

# Start the development server
ng serve
```

5. Open your browser to `http://localhost:4200`

### Configuration

The application uses Angular's dependency injection system for configuration. You can modify the AI settings in:

- `projects/ai-tooling/src/lib/ai.config.ts` - Core AI configuration
- `projects/ai-web/src/app/app.config.ts` - Application-specific AI settings

### AI Tooling Library

The `ai-tooling` library provides core services and directives:

- `AiService`: Core service for AI communications
- `AiBackendService`: Handles API requests to the AI provider
- `AiClickDirective`: Adds AI-powered click behavior
- `AiScrollDirective`: Implements smart scrolling with AI assistance
- `AiTool Decorator`: Enables function calling capabilities for the AI

### Working with AI Tools

You can create custom AI tools using the `@AiTool` decorator:

```typescript
@AiTool({
  description: 'Clicks on a designated target element',
  parameters: TargetSchema, // Zod schema defining the expected parameters
})
clickOn({ targetId }: ClickTarget): void {
  // Implementation to trigger a click on the target element
}
```

## OpenAI API Test Script

The project includes a TypeScript script for testing the OpenAI API. This script is useful for:

- Testing your OpenAI API key and connectivity
- Exploring different API endpoints

### Usage

1. Create a `.env` file from the provided template:

   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key to the `.env` file:

   ```
   OPENAI_API_KEY=your-api-key-here
   ```

3. Run the test script using one of these methods:

   ```bash
   # Using the npm script (recommended)
   npm run test:openai

   # Or directly with tsx
   npx tsx openai-api-test.ts
   ```

### Features

The script tests several OpenAI API endpoints:

- **Chat Completions**: Basic question answering
- **Function Calling**: Testing tool usage capabilities

You can enable/disable specific tests by modifying the flags in the `runTests()` function.

## Chat Implementation

The application includes a fully-functional chat interface with:

- Message history persistence
- Streaming responses from the AI
- Support for markdown rendering
- Tool-using capabilities through function calling
- Context management for coherent conversations

## Teaching Focus

This project is designed as a teaching tool to demonstrate:

2. **Agentic AI Design Patterns** in real-world applications
3. **Practical Implementation** of AI-enhanced UI components
4. **Responsible AI Development** with appropriate user controls

## Key Concepts

- **AI Agents**: Software entities that observe, decide, and act autonomously
- **Tool-Using AI**: AI systems that can leverage defined functions to accomplish tasks
- **Context-Aware Assistance**: AI that understands application state to provide relevant help
- **Reactive AI**: AI capabilities that adapt to changing user and application conditions
- **Function Calling**: Enabling LLMs to call predefined application functions

## License

MIT
