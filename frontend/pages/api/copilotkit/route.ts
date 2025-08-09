import { CopilotRuntime, OpenAIAdapter } from '@copilotkit/backend';

export const runtime = 'edge';

const copilotKit = new CopilotRuntime({
  debug: true,
});

export async function POST(req: Request): Promise<Response> {
  return copilotKit.response(
    req,
    new OpenAIAdapter({
      model: 'gpt-4',
      // You can add your OpenAI API key here or use environment variables
      // apiKey: process.env.OPENAI_API_KEY,
    })
  );
}
