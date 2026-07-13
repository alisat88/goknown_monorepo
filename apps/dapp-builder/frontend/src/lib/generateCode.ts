import { API_COMPONENTS } from '../data';

export interface GenerationConfig {
  dappName: string;
  description?: string;
  template: string;
  apis: string[];
  workflow: string[];
  userPrompt: string;
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3333';

/**
 * Returns an error string if the generated HTML looks like a header-only shell,
 * or null if it looks like a complete app.
 */
export function validateGeneratedHtml(html: string): string | null {
  if (!html || html.length < 800) {
    return 'The generated output was too short to be a working app.';
  }

  const lower = html.toLowerCase();

  const bodyStart = lower.indexOf('<body');
  const bodyContent = bodyStart >= 0 ? lower.slice(bodyStart) : lower;

  const hasInteractive =
    bodyContent.includes('<input') ||
    bodyContent.includes('<button') ||
    bodyContent.includes('<form') ||
    bodyContent.includes('<select') ||
    bodyContent.includes('<textarea');

  if (!hasInteractive) {
    return 'The generated app has no input fields or buttons. Please regenerate.';
  }

  const buttonCount = (bodyContent.match(/<button/g) ?? []).length;
  const inputCount = (bodyContent.match(/<input/g) ?? []).length;
  if (html.length < 2000 && buttonCount + inputCount < 2) {
    return 'The generated app looks incomplete (very short with few interactive elements). Please regenerate.';
  }

  return null;
}

// Exported for unit tests — documents what the edit prompt looks like without making an API call.
export function buildEditUserPrompt(currentHtml: string, followUpPrompt: string, appName: string): string {
  return `App name: "${appName}"

Requested changes:
${followUpPrompt.trim()}

Current app HTML (apply changes to this):
${currentHtml}`;
}

export async function generateDAppCode(config: GenerationConfig): Promise<string> {
  const apiDetails = config.apis
    .map((id) => {
      const api = API_COMPONENTS.find((a) => a.id === id);
      return api ? `${api.name} (${api.endpoint}): ${api.purpose}` : id;
    })
    .join(', ');

  const response = await fetch(`${API_URL}/dapp-builder/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      dappName: config.dappName,
      description: config.description,
      template: config.template,
      apiDetails,
      workflow: config.workflow,
      userPrompt: config.userPrompt,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Generation failed (${response.status})`);
  }

  const data = await response.json() as { html: string };
  return data.html;
}

export async function generateEditedDAppCode(
  currentHtml: string,
  followUpPrompt: string,
  appName: string
): Promise<string> {
  const response = await fetch(`${API_URL}/dapp-builder/edit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ currentHtml, followUpPrompt, appName }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Edit failed (${response.status})`);
  }

  const data = await response.json() as { html: string };
  return data.html;
}
