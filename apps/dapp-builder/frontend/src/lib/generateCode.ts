import { Template, WorkflowBlock } from '../types';
import { API_COMPONENTS } from '../data';
import { buildConfig } from './buildConfig';

export async function generateDAppCode(
  template: Template | null,
  workflowSteps: WorkflowBlock[],
  dappName: string,
  apiKey: string
): Promise<string> {
  const config = buildConfig(template, workflowSteps, dappName || undefined);

  const apiDescriptions = config.apis
    .map((apiId) => {
      const api = API_COMPONENTS.find((a) => a.id === apiId);
      return api ? `${api.name} (${api.endpoint}): ${api.purpose}` : apiId;
    })
    .join('\n  - ');

  const userPrompt = `Generate a React TypeScript dApp called "${config.dappName}" using the "${config.template}" template.

It should use these API services:
  - ${apiDescriptions || 'No APIs specified'}

The workflow is: ${config.workflow.join(' → ') || 'No steps defined'}

Include:
- A main App component with basic routing
- Service call stubs for each API (matching the endpoints above)
- Basic UI components for the ${config.template} template type
- TypeScript interfaces for the data shapes
- Inline comments explaining each section`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system:
        "You are a dApp code generator. Generate clean, production-ready TypeScript/React code for the dApp described in the user's config. Return only the code — no explanation, no markdown fences.",
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `HTTP ${response.status}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  return data.content[0].text;
}
