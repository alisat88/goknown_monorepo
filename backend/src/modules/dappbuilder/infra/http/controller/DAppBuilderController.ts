import axios from 'axios';
import { Request, Response } from 'express';

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

const EDIT_SYSTEM_PROMPT = `You are a no-code app editor. The user has a working HTML app and wants specific changes made to it.

Apply the requested changes and return the complete updated HTML app.

RULES:
- Keep everything that works and is not mentioned in the change request
- Apply ONLY the changes the user asks for — do not restructure or redesign the whole app unless explicitly asked
- Preserve the color scheme, layout structure, and all functionality not mentioned in the request
- Vanilla JavaScript only — zero external dependencies, no CDN, no npm
- Return ONLY raw HTML starting with <!DOCTYPE html> — no markdown fences, no preamble, no explanation`;

interface GenerateBody {
  dappName: string;
  description?: string;
  template: string;
  apiDetails: string;
  workflow: string[];
  userPrompt: string;
}

interface EditBody {
  currentHtml: string;
  followUpPrompt: string;
  appName: string;
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

interface AnthropicErrorResponse {
  error?: { message?: string };
}

function buildGeneratePrompt(body: GenerateBody): string {
  const lines: string[] = [];
  lines.push(`Build an app called "${body.dappName}".`);
  const desc = body.description?.trim();
  const prompt = body.userPrompt?.trim();
  if (desc) lines.push(`What this app does: ${desc}`);
  if (prompt && prompt !== desc) lines.push(`Detailed requirements: ${prompt}`);
  if (body.template && body.template !== 'none' && body.template !== 'custom') {
    lines.push(`Starting pattern: "${body.template}".`);
  }
  if (body.apiDetails) {
    lines.push(`Mock these services (stub all calls, no real HTTP): ${body.apiDetails}.`);
  }
  if (body.workflow.length > 0) {
    lines.push(`User workflow steps: ${body.workflow.join(' → ')}.`);
  }
  lines.push(
    'Remember: generate the COMPLETE app — all six required sections must be present. ' +
    'Pre-populate the history section with 3 demo rows. Every button must do something visible.'
  );
  return lines.join('\n');
}

function buildEditPrompt(body: EditBody): string {
  return `App name: "${body.appName}"

Requested changes:
${body.followUpPrompt.trim()}

Current app HTML (apply changes to this):
${body.currentHtml}`;
}

function stripFences(raw: string): string {
  let html = raw.replace(/^```[a-zA-Z]*\n?/, '').trim();
  html = html.replace(/\n?```$/, '').trim();
  if (html.startsWith('```')) {
    html = html.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  return html;
}

async function callAnthropic(apiKey: string, system: string, userMessage: string): Promise<string> {
  const anthropicRes = await axios.post<AnthropicResponse>(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system,
      messages: [{ role: 'user', content: userMessage }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 120000,
    }
  );
  return stripFences(anthropicRes.data.content[0].text);
}

export default class DAppBuilderController {
  public async generate(request: Request, response: Response): Promise<Response> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return response.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on this server.' });
    }

    try {
      const body = request.body as GenerateBody;
      const userMessage = buildGeneratePrompt(body);
      const html = await callAnthropic(apiKey, SYSTEM_PROMPT, userMessage);
      return response.json({ html });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        const data = err.response.data as AnthropicErrorResponse;
        const message = data?.error?.message ?? 'Anthropic API error';
        const forwardStatus = status === 401 || status === 429 ? status : 502;
        return response.status(forwardStatus).json({ error: `${status}:${message}` });
      }
      throw err;
    }
  }

  public async edit(request: Request, response: Response): Promise<Response> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return response.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on this server.' });
    }

    try {
      const body = request.body as EditBody;
      const userMessage = buildEditPrompt(body);
      const html = await callAnthropic(apiKey, EDIT_SYSTEM_PROMPT, userMessage);
      return response.json({ html });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        const data = err.response.data as AnthropicErrorResponse;
        const message = data?.error?.message ?? 'Anthropic API error';
        const forwardStatus = status === 401 || status === 429 ? status : 502;
        return response.status(forwardStatus).json({ error: `${status}:${message}` });
      }
      throw err;
    }
  }
}
