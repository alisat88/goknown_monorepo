import { API_COMPONENTS } from '../data';

export interface GenerationConfig {
  dappName: string;
  description?: string;   // short app description from step 1
  template: string;
  apis: string[];          // API IDs — resolved to descriptions internally
  workflow: string[];
  userPrompt: string;      // detailed free-form prompt from step 1
}

const SYSTEM_PROMPT = `You are a no-code app builder that generates complete, working, self-contained HTML apps. Your output is immediately rendered in a sandboxed iframe for a non-technical user to interact with.

REQUIRED — your output MUST contain ALL of the following six sections. Omitting any section is not acceptable:
1. HEADER — app name, short tagline, optional status/wallet chip
2. INPUT AREA — form fields relevant to the app's purpose (text inputs, number fields, pickers, dropdowns)
3. ACTION BUTTONS — at least one primary button that triggers a visible, immediate state change
4. RESULTS / STATS PANEL — a card or section that shows output data after the user takes an action
5. HISTORY / LOG LIST — a table or list pre-populated with 3 realistic demo rows that updates when the user adds more
6. STATUS BAR — shows success, error, and loading states in a non-technical way

MANDATORY RULES:
- Vanilla JavaScript only — zero external dependencies, no CDN, no npm
- All data operations are local mock functions — no real network calls
- Simulate async delay (400–700 ms) so buttons feel responsive
- Clicking any button MUST visibly change state on screen immediately after the delay
- Pre-populate history with 3 believable demo entries so the app looks alive on first load
- Do NOT generate a placeholder, skeleton, or "coming soon" UI — generate the full working app
- Do NOT generate only a header and blank space — the body MUST be present and complete
- Every input field must accept user input and connect to at least one action
- Color scheme: page background #0d1117, card background #1a1f3c, primary accent #26b8ff, secondary #4ee5ff, text #e8f4ff, muted text #7aa0c4
- Readable font sizes: body 15px minimum, labels 13px minimum
- Make the layout fill the screen height — no large blank white space below the fold
- Return ONLY raw HTML starting with <!DOCTYPE html> — no markdown fences, no preamble, no explanation`;

function buildUserPrompt(config: GenerationConfig): string {
  const apiDetails = config.apis
    .map((id) => {
      const api = API_COMPONENTS.find((a) => a.id === id);
      return api
        ? `${api.name} (${api.endpoint}): ${api.purpose}`
        : id;
    })
    .join(', ');

  const lines: string[] = [];

  lines.push(`Build an app called "${config.dappName}".`);

  // description and userPrompt both describe what the app does — include both
  const desc = config.description?.trim();
  const prompt = config.userPrompt?.trim();
  if (desc) {
    lines.push(`What this app does: ${desc}`);
  }
  if (prompt && prompt !== desc) {
    lines.push(`Detailed requirements: ${prompt}`);
  }

  if (config.template && config.template !== 'none' && config.template !== 'custom') {
    lines.push(`Starting pattern: "${config.template}".`);
  }

  if (apiDetails) {
    lines.push(`Mock these services (stub all calls, no real HTTP): ${apiDetails}.`);
  }

  if (config.workflow.length > 0) {
    lines.push(`User workflow steps: ${config.workflow.join(' → ')}.`);
  }

  lines.push(
    'Remember: generate the COMPLETE app — all six required sections must be present. ' +
    'Pre-populate the history section with 3 demo rows. Every button must do something visible.'
  );

  return lines.join('\n');
}

/**
 * Returns an error string if the generated HTML looks like a header-only shell,
 * or null if it looks like a complete app.
 */
export function validateGeneratedHtml(html: string): string | null {
  if (!html || html.length < 800) {
    return 'The generated output was too short to be a working app.';
  }

  const lower = html.toLowerCase();

  // Find body content (after <body tag, or entire string if no explicit body)
  const bodyStart = lower.indexOf('<body');
  const bodyContent = bodyStart >= 0 ? lower.slice(bodyStart) : lower;

  // Must have at least one interactive element
  const hasInteractive =
    bodyContent.includes('<input') ||
    bodyContent.includes('<button') ||
    bodyContent.includes('<form') ||
    bodyContent.includes('<select') ||
    bodyContent.includes('<textarea');

  if (!hasInteractive) {
    return 'The generated app has no input fields or buttons. Please regenerate.';
  }

  // If the HTML is very short AND has fewer than 3 interactive elements it's likely incomplete
  const buttonCount = (bodyContent.match(/<button/g) ?? []).length;
  const inputCount = (bodyContent.match(/<input/g) ?? []).length;
  if (html.length < 2000 && buttonCount + inputCount < 2) {
    return 'The generated app looks incomplete (very short with few interactive elements). Please regenerate.';
  }

  return null;
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
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(config) }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`${response.status}:${err.error?.message ?? 'API request failed'}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const raw = data.content[0].text;

  // Strip markdown fences — handles ```html, ```HTML, ```tsx, ``` with/without trailing spaces
  let html = raw.replace(/^```[a-zA-Z]*\n?/, '').trim();
  html = html.replace(/\n?```$/, '').trim();
  if (html.startsWith('```')) {
    html = html.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  return html;
}
