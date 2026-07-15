import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateDAppWizard } from '../components/CreateDAppWizard';
import { loadSavedApps } from '../services/storage';
import { TEMPLATES } from '../data';

// ── API mocks ─────────────────────────────────────────────────────────────────

vi.mock('../lib/generateCode', () => ({
  generateDAppCode: vi.fn(),
  generateEditedDAppCode: vi.fn(),
  validateGeneratedHtml: vi.fn(() => null),
  buildEditUserPrompt: vi.fn(),
}));

// jsdom lacks these browser APIs used inside the component
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// ── Test data ─────────────────────────────────────────────────────────────────

const GENERATED_HTML = '<html><body><h1>My App</h1><button>Go</button></body></html>';
const EDITED_HTML    = '<html><body><h1>Edited App</h1><button>Go</button></body></html>';

const template = TEMPLATES[0]; // Token Dashboard

const defaultProps = {
  template,
  workflowSteps: [],
  onWorkflowChange: vi.fn(),
  wizardStep: 3 as const,
  onStepChange: vi.fn(),
  onClose: vi.fn(),
  currentUserEmail: 'atiselska@goknown.com',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderAndGenerate(generateMock = GENERATED_HTML) {
  const { generateDAppCode } = await import('../lib/generateCode');
  vi.mocked(generateDAppCode).mockResolvedValueOnce(generateMock);

  render(<CreateDAppWizard {...defaultProps} />);
  fireEvent.click(screen.getByText('Generate App'));

  await waitFor(() => {
    expect(screen.getByPlaceholderText('Describe any changes you want to make…')).toBeDefined();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreateDAppWizard — post-generation follow-up flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('follow-up textarea appears after successful generation', async () => {
    await renderAndGenerate();

    const textarea = screen.getByPlaceholderText('Describe any changes you want to make…');
    expect(textarea).toBeDefined();
  });

  test('"Apply changes" button is present after generation', async () => {
    await renderAndGenerate();

    expect(screen.getByText('Apply changes')).toBeDefined();
  });

  test('"No edits needed — save to library" button is present after generation', async () => {
    await renderAndGenerate();

    expect(screen.getByText('No edits needed — save to library')).toBeDefined();
  });

  test('"Apply changes" calls generateEditedDAppCode with the typed prompt', async () => {
    const { generateEditedDAppCode } = await import('../lib/generateCode');
    vi.mocked(generateEditedDAppCode).mockResolvedValueOnce(EDITED_HTML);

    await renderAndGenerate();

    const textarea = screen.getByPlaceholderText('Describe any changes you want to make…');
    fireEvent.change(textarea, { target: { value: 'Make the header blue' } });
    fireEvent.click(screen.getByText('Apply changes'));

    await waitFor(() => {
      expect(vi.mocked(generateEditedDAppCode)).toHaveBeenCalledWith(
        expect.any(String),
        'Make the header blue',
        expect.any(String),
      );
    });
  });

  test('"Apply changes" clears the textarea on success', async () => {
    const { generateEditedDAppCode } = await import('../lib/generateCode');
    vi.mocked(generateEditedDAppCode).mockResolvedValueOnce(EDITED_HTML);

    await renderAndGenerate();

    const textarea = screen.getByPlaceholderText('Describe any changes you want to make…') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Add a dark mode toggle' } });
    fireEvent.click(screen.getByText('Apply changes'));

    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  test('"No edits needed — save to library" shows confirmation', async () => {
    await renderAndGenerate();

    fireEvent.click(screen.getByText('No edits needed — save to library'));

    await waitFor(() => {
      expect(screen.getByText(/App saved to your library/)).toBeDefined();
    });
  });

  test('"No edits needed — save to library" persists the generated HTML to localStorage', async () => {
    await renderAndGenerate();

    fireEvent.click(screen.getByText('No edits needed — save to library'));

    const apps = loadSavedApps();
    const saved = apps.find((a) => a.ownerId === 'atiselska@goknown.com');
    expect(saved).toBeDefined();
    expect(saved!.generatedCode).toBe(GENERATED_HTML);
  });

  test('save persists the EDITED HTML after applying changes', async () => {
    const { generateEditedDAppCode } = await import('../lib/generateCode');
    vi.mocked(generateEditedDAppCode).mockResolvedValueOnce(EDITED_HTML);

    await renderAndGenerate();

    // Apply an edit
    const textarea = screen.getByPlaceholderText('Describe any changes you want to make…') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Change the title' } });
    fireEvent.click(screen.getByText('Apply changes'));
    await waitFor(() => expect(textarea.value).toBe(''));

    // Save
    fireEvent.click(screen.getByText('No edits needed — save to library'));

    await waitFor(() => {
      expect(screen.getByText(/App saved to your library/)).toBeDefined();
    });

    const apps = loadSavedApps();
    const saved = apps.find((a) => a.ownerId === 'atiselska@goknown.com');
    expect(saved!.generatedCode).toBe(EDITED_HTML);
    expect(saved!.generatedCode).not.toBe(GENERATED_HTML);
  });
});
