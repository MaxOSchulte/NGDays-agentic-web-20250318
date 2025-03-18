# AI Agent Demo

This project demonstrates how to build AI-enhanced applications using Angular, with a focus on agentic AI capabilities for teaching purposes.

## Overview

AI Agent Demo showcases practical implementations of AI agents within web applications, combining modern Angular architecture with powerful AI services. This project serves as a learning resource to understand how AI can enhance user interfaces and application functionality through directives, services, and reactive patterns.

## Disclaimer

**Note:** Parts of the ai-web application in this project were generated using generative AI tools. This approach demonstrates how AI can be leveraged not only as a feature within applications but also as a development accelerator in the creation process itself.

## Project Structure

The project consists of two main parts:

1. **AI Tooling Library** (`projects/ai-tooling`): Reusable components for AI integration
2. **AI Web Application** (`projects/ai-web`): Demo application showcasing the AI capabilities

## Key AI Features

### Agentic AI Capabilities

This demo implements several agentic AI patterns that allow the AI to:

- **Understand Context**: By analyzing user behavior and application state
- **Take Actions**: By triggering functions or suggesting next steps
- **Learn From Interactions**: By storing and retrieving interaction patterns

### AI Service Architecture

The core `AiService` provides a foundation for AI capabilities with:

- Configurable AI endpoints
- Request/response management
- Context handling
- Function calling capabilities

### UI Integration

The project demonstrates practical implementations of:

- **AI-powered click directives**: Enhance elements with intelligent behavior
- **AI-assisted scrolling**: Provide context-aware scrolling recommendations
- **Conversational UI**: A fully-functional chat interface with the AI agent

### Todo Application with AI Features

The Todo application showcases:

- AI-assisted task creation
- Smart categorization of tasks
- Contextual recommendations based on user patterns

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Angular CLI (v19 or higher)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
ng serve
```

### AI Tooling Library

The `ai-tooling` library provides core services and directives:

- `AiService`: Core service for AI communications
- `AiBackendService`: Handles API requests to the AI provider
- `AiClickDirective`: Adds AI-powered click behavior
- `AiScrollDirective`: Implements smart scrolling with AI assistance

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

## License

MIT
