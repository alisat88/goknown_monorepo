import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateDAppWizard } from '../components/CreateDAppWizard';
import { TEMPLATES } from '../data';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/generateCode', () => ({
  generateDAppCode: vi.fn(),
  generateEditedDAppCode: vi.fn(),
  validateGeneratedHtml: vi.fn(() => null),
  buildEditUserPrompt: vi.fn(),
}));

// Mock storage so wizard tests stay unit tests (storage behavior is in e2e tests).
const mockSaveApp    = vi.fn((app: unknown) => Promise.resolve(app));
const mockUpdateApp  = vi.fn((id: unknown, updates: unknown) => Promise.resolve(updates));
vi.mock('../services/storage', () => ({
  saveApp:     (app: unknown) => mockSaveApp(app),
  updateApp:   (id: unknown, updates: unknown) => mockUpdateApp(id, updates),
  loadSavedApps: vi.fn(() => Promise.resolve([])),
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
    mockSaveApp.mockImplementation((app: unknown) => Promise.resolve(app));
    mockUpdateApp.mockImplementation((_id: unknown, updates: unknown) => Promise.resolve(updates));
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

  test('"No edits needed — save to library" calls saveApp or updateApp with the generated HTML', async () => {
    await renderAndGenerate();

    fireEvent.click(screen.getByText('No edits needed — save to library'));

    await waitFor(() => {
      const savedOrUpdated = mockSaveApp.mock.calls.length > 0 || mockUpdateApp.mock.calls.length > 0;
      expect(savedOrUpdated).toBe(true);
    });

    // Verify the HTML was persisted (either via save or update)
    const allCalls = [
      ...mockSaveApp.mock.calls.map(([a]: [unknown]) => a),
      ...mockUpdateApp.mock.calls.map(([, u]: [unknown, unknown]) => u),
    ] as Array<Record<string, unknown>>;
    const htmlPersisted = allCalls.some(
      (call) => typeof call === 'object' && (call?.generatedCode === GENERATED_HTML || call?.generatedCode === GENERATED_HTML)
    );
    expect(htmlPersisted).toBe(true);
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

    // Verify the EDITED HTML was ultimately persisted (the last updateApp call should have it)
    const updateCalls = mockUpdateApp.mock.calls as Array<[unknown, Record<string, unknown>]>;
    const lastUpdate = updateCalls[updateCalls.length - 1];
    const finalHtml = lastUpdate?.[1]?.generatedCode;
    expect(finalHtml).toBe(EDITED_HTML);
    expect(finalHtml).not.toBe(GENERATED_HTML);
  });
});
