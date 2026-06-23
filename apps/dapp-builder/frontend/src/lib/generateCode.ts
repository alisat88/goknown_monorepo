import { API_COMPONENTS } from '../data';

export interface GenerationConfig {
  dappName: string;
  template: string;
  apis: string[];      // API IDs from buildConfig — resolved to descriptions internally
  workflow: string[];
  userPrompt: string;
}

const SYSTEM_PROMPT = `You are a dApp frontend code generator. Generate a single self-contained HTML file with embedded CSS and JavaScript that implements the dApp described. Requirements:
(1) No external dependencies except a CDN-hosted React/ReactDOM via unpkg, or a plain vanilla JS implementation — pick whichever fits better.
(2) Working UI with real interactivity — buttons do things, forms submit, state updates visibly.
(3) Stub the API service calls as async functions that log to console and return realistic mock data so the UI behaves as if connected.
(4) Include the dApp name as the page title and a visible header.
(5) Use a dark blue / Web3 color scheme matching #26b8ff, #4ee5ff, #1a1f3c as the palette.
(6) Return ONLY the HTML — no explanation, no markdown fences, no preamble.`;

function buildUserPrompt(config: GenerationConfig): string {
  const apiDetails = config.apis
    .map((id) => {
      const api = API_COMPONENTS.find((a) => a.id === id);
      return api
        ? `${api.name} (${api.endpoint}): ${api.purpose}`
        : id;
    })
    .join(', ');

  const lines = [
    `Build a dApp called "${config.dappName}" using the "${config.template}" pattern.`,
    `Selected API services: ${apiDetails || 'none'}, each with stub implementations.`,
    `Workflow steps in order: ${config.workflow.join(' → ') || 'none'}.`,
  ];

  if (config.userPrompt.trim()) {
    lines.push(`Additional requirements from the builder: ${config.userPrompt.trim()}`);
  }

  lines.push(
    'Make the UI fully interactive — include real state, working button handlers, and visible feedback for every user action.'
  );

  return lines.join('\n');
}

export async function generateDAppCode(
  config: GenerationConfig,
  apiKey: string
): Promise<string> {
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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(config) }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    // Prefix with HTTP status so call sites can classify the error
    throw new Error(`${response.status}:${err.error?.message ?? 'API request failed'}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  let html = data.content[0].text.trim();

  // Strip markdown fences if the model still wraps output despite instructions
  if (html.startsWith('```')) {
    html = html.replace(/^```[a-z]*\n?/i, '').replace(/\n?```\s*$/i, '');
  }

  return html;
}
