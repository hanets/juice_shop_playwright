/* eslint-disable no-console */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import OpenAI from 'openai';
import { AppConfig } from './utils/config/AppConfig';
import { createRandomRegisterUserRequest } from './utils/models/user';
import { request, APIRequestContext } from '@playwright/test';
import { registerUser } from './utils/api/UserService';

const MAX_ITERATIONS = 20; // Safety limit for agent loop

async function main() {
  //create user by api
  const requestObj: APIRequestContext = await request.newContext();
  const registerPayload = createRandomRegisterUserRequest();
  await registerUser(requestObj, registerPayload);

  const openai = new OpenAI({ apiKey: AppConfig.ai.openApiKey });

  // Get task from command line or use default
  const userTask =
    process.argv[2] ||
    '1.   Open http://localhost:3000/, close any modal popup.' +
      "2. If user isn't logged in, open login page and login with email: " +
      registerPayload.email +
      ' and password: ' +
      registerPayload.password +
      "(Don't use google login). 3. Try to checkout any product (add to cart, go to checkout, fill in address and payment info, and confirm the order).";

  console.log('🚀 Starting Playwright MCP Client');
  console.log(`📋 Task: ${userTask}`);
  console.log('─'.repeat(60));

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
  });

  const client = new Client(
    {
      name: 'juice-shop-playwright-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    },
  );

  await client.connect(transport);
  console.log('✅ Connected to Playwright MCP server');

  // Get available tools from MCP server
  const toolsResponse = await client.listTools();
  console.log(`🔧 Available tools: ${toolsResponse.tools.map((t) => t.name).join(', ')}`);
  console.log('─'.repeat(60));

  // Convert MCP tools to OpenAI function format
  const openaiTools: OpenAI.Chat.ChatCompletionTool[] = toolsResponse.tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description || '',
      parameters: tool.inputSchema as Record<string, unknown>,
    },
  }));

  // Initialize conversation
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a browser automation assistant using Playwright MCP tools.
Your job is to complete the user's task by interacting with web pages.

Guidelines:
- Use playwright_navigate to go to URLs
- Use browser_snapshot to see the current page state (accessibility tree)
- Use playwright_click to click elements (use the element's ref from the snapshot)
- Use playwright_fill to enter text into input fields
- Use playwright_screenshot to capture the page if needed
- When you have completed the task, provide a clear summary of what you found/did

Be efficient and complete the task in as few steps as possible.`,
    },
    {
      role: 'user',
      content: userTask,
    },
  ];

  // Agent loop - continue until model stops calling tools
  let iteration = 0;
  let continueLoop = true;

  while (continueLoop && iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n🔄 Iteration ${iteration}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: openaiTools,
      tool_choice: 'auto',
      max_tokens: 2000,
    });

    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);

    // Check if the model wants to call tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`📞 Tool calls: ${assistantMessage.tool_calls.length}`);

      for (const toolCall of assistantMessage.tool_calls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const call = toolCall as any; // Cast to bypass OpenAI SDK type issue
        const toolName = call.function.name;
        const toolArgs = JSON.parse(call.function.arguments);

        console.log(`  → Executing: ${toolName}`);
        if (Object.keys(toolArgs).length > 0) {
          console.log(`    Args: ${JSON.stringify(toolArgs)}`);
        }

        try {
          // Call the MCP tool
          const result = await client.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          // Extract the result content
          const resultContent =
            (result.content as Array<{ type: string; text?: string }>)
              .map((c) => (c.type === 'text' ? c.text : JSON.stringify(c)))
              .join('\n') || 'Tool executed successfully';

          // Truncate very long results for logging
          const logContent =
            resultContent.length > 500
              ? resultContent.substring(0, 500) + '... (truncated)'
              : resultContent;
          console.log(`    ✅ Result: ${logContent}`);

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: resultContent,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`    ❌ Error: ${errorMessage}`);

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: `Error: ${errorMessage}`,
          });
        }
      }
    } else {
      // No more tool calls - model has finished
      continueLoop = false;
      console.log('\n' + '═'.repeat(60));
      console.log('📝 FINAL RESPONSE:');
      console.log('═'.repeat(60));
      console.log(assistantMessage.content);
      console.log('═'.repeat(60));
    }
  }

  if (iteration >= MAX_ITERATIONS) {
    console.log(`\n⚠️ Reached maximum iterations (${MAX_ITERATIONS})`);
  }

  // Cleanup
  console.log('\n🔌 Closing MCP connection...');
  await client.close();
  console.log('✅ Done!');
}

main().catch((error) => {
  console.error('❌ Error running MCP client:', error);
  process.exit(1);
});
