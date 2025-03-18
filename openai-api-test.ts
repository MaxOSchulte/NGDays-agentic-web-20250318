import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { AiConfigurations } from './projects/ai-tooling/src/lib/ai.config';

// Load environment variables from .env file if it exists
dotenv.config();

// Get API key from environment variables
const apiKey =
  process.env['OPENAI_API_KEY'] || process.env['OPENROUTER_API_KEY'];

if (!apiKey) {
  console.error('Error API_KEY environment variable is not set');
  console.error('Please set it in a .env file or export it in your shell');
  console.error('Example: echo "OPENAI_API_KEY=your-api-key" > .env');
  process.exit(1);
}

// Create OpenAI client
const openai = new OpenAI({
  apiKey: 'REPLACE',
  baseURL: AiConfigurations.OpenRouter.baseURL,
});

/**
 * Test basic chat completion
 */
async function testChatCompletion() {
  console.log('\n🤖 Testing Chat Completion API...');

  try {
    const response = await openai.chat.completions.create({
      model: AiConfigurations.OpenRouter.model,
      messages: [
        { role: 'system', content: 'You are an angry unhelful assistent' },
        { role: 'user', content: 'What are the top 3 features of TypeScript?' },
      ],
      temperature: 0,
    });

    console.log('✅ Chat Completion Response:');
    console.log('Model used:', response.model);
    console.log('\nResponse:', response.choices[0].message.content);
    console.log('\nTokens used:', {
      prompt_tokens: response.usage?.prompt_tokens,
      completion_tokens: response.usage?.completion_tokens,
      total_tokens: response.usage?.total_tokens,
    });

    return response;
  } catch (error: any) {
    console.error('❌ Error in chat completion:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

/**
 * Main function to run all tests
 */
async function runTests() {
  console.log('🚀 Starting OpenAI API Tests...');

  try {
    await testChatCompletion();

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Error running tests:', error);
  }
}

// Run the tests
runTests();
