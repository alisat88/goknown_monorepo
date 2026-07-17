import React from 'react';
import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateLibrary } from '../components/TemplateLibrary';
import { CreateDAppWizard } from '../components/CreateDAppWizard';
import { TEMPLATES } from '../data';
import { SavedDApp } from '../types';
import { AuthError } from '../services/api';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/generateCode', () => ({
  generateDAppCode: vi.fn(),
  generateEditedDAppCode: vi.fn(),
  validateGeneratedHtml: vi.fn(() => null),
  buildEditUserPrompt: vi.fn(),
}));

const mockSaveApp   = vi.fn();
const mockUpdateApp = vi.fn();
vi.mock('../services/storage', () => ({
  saveApp:      (app: unknown) => mockSaveApp(app),
  updateApp:    (id: unknown, updates: unknown) => mockUpdateApp(id, updates),
  loadSavedApps: vi.fn(() => Promise.resolve([])),
}));

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// ── Test fixtures ─────────────────────────────────────────────────────────────

const GENERATED_HTML = '<html><body><h1>App</h1><button>Go</button></body></html>';
const AVAILABLE_TEMPLATES = TEMPLATES.filter((t) => t.status !== 'Coming soon');
const TOKEN_DASHBOARD = TEMPLATES.find((t) => t.id === 'token-dashboard')!;

const wizardProps = {
  template: TOKEN_DASHBOARD,
  workflowSteps: [],
  onWorkflowChange: vi.fn(),
  wizardStep: 3 as const,
  onStepChange: vi.fn(),
  onClose: vi.fn(),
  currentUserEmail: 'atiselska@goknown.com',
};

function makeEditingApp(overrides: Partial<SavedDApp> = {}): SavedDApp {
  return {
    id: `dapp_${crypto.randomUUID()}`,
    dappName: 'Existing App',
    description: '',
    template: 'token-dashboard',
    permissionModel: 'role-based',
    apis: [],
    workflow: [],
    generatedCode: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    sharedWith: [],
    sharedAccess: [],
    ownerId: 'atiselska@goknown.com',
    ownerName: 'Alisa',
    status: 'Draft',
    version: 1,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockSaveApp.mockImplementation((app: unknown) => Promise.resolve(app));
  mockUpdateApp.mockImplementation((_id: unknown, updates: unknown) => Promise.resolve(updates));
});

// ── Tests ─────────────────────────────────────────────────────────────────────

// template-flow-1: Every non-Coming-Soon template renders a button the user can click
test('template-flow-1: TemplateLibrary renders a use-template button for every available template', () => {
  render(
    <TemplateLibrary
      selectedTemplate={null}
      onSelectTemplate={vi.fn()}
      onUseTemplate={vi.fn()}
    />,
  );

  for (const t of AVAILABLE_TEMPLATES) {
    expect(screen.getByText(t.name)).toBeDefined();
  }

  const useButtons = [
    ...screen.queryAllByText('Use this template →'),
    ...screen.queryAllByText('+ Start from scratch →'),
  ];
  expect(useButtons).toHaveLength(AVAILABLE_TEMPLATES.length);
});

// template-flow-2: Clicking "Use this template" calls onUseTemplate with the exact Template object
test('template-flow-2: clicking "Use this template" button passes the correct template to onUseTemplate', () => {
  const onUseTemplate = vi.fn();
  render(
    <TemplateLibrary
      selectedTemplate={null}
      onSelectTemplate={vi.fn()}
      onUseTemplate={onUseTemplate}
    />,
  );

  // First "Use this template →" button belongs to token-dashboard (first in TEMPLATES)
  const [firstBtn] = screen.getAllByText('Use this template →');
  fireEvent.click(firstBtn);

  expect(onUseTemplate).toHaveBeenCalledTimes(1);
  expect(onUseTemplate).toHaveBeenCalledWith(TOKEN_DASHBOARD);
});

// template-flow-3: Clicking the card body (not the button) calls onSelectTemplate
test('template-flow-3: clicking the card body calls onSelectTemplate with the correct template', () => {
  const onSelectTemplate = vi.fn();
  render(
    <TemplateLibrary
      selectedTemplate={null}
      onSelectTemplate={onSelectTemplate}
      onUseTemplate={vi.fn()}
    />,
  );

  // Click the template name heading — bubbles to the card div's onClick
  fireEvent.click(screen.getByText(TOKEN_DASHBOARD.name));

  expect(onSelectTemplate).toHaveBeenCalledTimes(1);
  expect(onSelectTemplate).toHaveBeenCalledWith(TOKEN_DASHBOARD);
});

// template-flow-4: Generate App button is enabled (not disabled) before generation begins
test('template-flow-4: Generate App button is not disabled before the user clicks it', () => {
  render(<CreateDAppWizard {...wizardProps} />);

  const generateBtn = screen.getByText('Generate App').closest('button') as HTMLButtonElement;
  expect(generateBtn).not.toBeNull();
  expect(generateBtn.disabled).toBe(false);
});

// template-flow-5: Clicking Generate App calls generateDAppCode exactly once
test('template-flow-5: clicking Generate App calls generateDAppCode exactly once per click', async () => {
  const { generateDAppCode } = await import('../lib/generateCode');
  vi.mocked(generateDAppCode).mockResolvedValueOnce(GENERATED_HTML);

  render(<CreateDAppWizard {...wizardProps} />);
  fireEvent.click(screen.getByText('Generate App'));

  await waitFor(() => {
    expect(vi.mocked(generateDAppCode)).toHaveBeenCalledTimes(1);
  });
});

// template-flow-6: generateDAppCode receives the template identifier from the wizard props
test('template-flow-6: generateDAppCode receives the template ID from the selected template', async () => {
  const { generateDAppCode } = await import('../lib/generateCode');
  vi.mocked(generateDAppCode).mockResolvedValueOnce(GENERATED_HTML);

  render(<CreateDAppWizard {...wizardProps} />);
  fireEvent.click(screen.getByText('Generate App'));

  await waitFor(() => {
    expect(vi.mocked(generateDAppCode)).toHaveBeenCalledWith(
      expect.objectContaining({ template: TOKEN_DASHBOARD.id }),
    );
  });
});

// template-flow-7: After successful generation, a live-app iframe is rendered
test('template-flow-7: successful generation renders a live-app preview iframe', async () => {
  const { generateDAppCode } = await import('../lib/generateCode');
  vi.mocked(generateDAppCode).mockResolvedValueOnce(GENERATED_HTML);

  render(<CreateDAppWizard {...wizardProps} />);
  fireEvent.click(screen.getByText('Generate App'));

  await waitFor(() => {
    expect(document.querySelector('iframe')).not.toBeNull();
  });
});

// template-flow-8: After a failed generation, an error message is visible in the wizard
test('template-flow-8: failed generation renders an error message in the wizard body', async () => {
  const { generateDAppCode } = await import('../lib/generateCode');
  vi.mocked(generateDAppCode).mockRejectedValueOnce(new Error('Network error'));

  render(<CreateDAppWizard {...wizardProps} />);
  fireEvent.click(screen.getByText('Generate App'));

  await waitFor(() => {
    expect(screen.getByText("We couldn't generate the app preview.")).toBeDefined();
  });
});

// template-flow-9: Editing an existing app — persistApp calls updateApp, not saveApp
test('template-flow-9: editing an existing app uses updateApp (not saveApp) to persist generated code', async () => {
  const { generateDAppCode } = await import('../lib/generateCode');
  vi.mocked(generateDAppCode).mockResolvedValueOnce(GENERATED_HTML);

  const editingApp = makeEditingApp();
  mockUpdateApp.mockResolvedValueOnce({ ...editingApp, generatedCode: GENERATED_HTML, status: 'Generated' });

  render(<CreateDAppWizard {...wizardProps} editingApp={editingApp} />);
  fireEvent.click(screen.getByText('Generate App'));

  await waitFor(() => {
    expect(mockUpdateApp).toHaveBeenCalledTimes(1);
  });
  expect(mockSaveApp).not.toHaveBeenCalled();
});

// template-flow-10: Authenticated prod mode (no token, no demo flag) throws AuthError — never localStorage
test('template-flow-10: production saveApp (no token, no VITE_DEMO_MODE) throws AuthError — localStorage is never used', async () => {
  const { saveApp: realSaveApp } = await vi.importActual<typeof import('../services/storage')>(
    '../services/storage',
  );
  vi.unstubAllEnvs();
  try { sessionStorage.removeItem('dappbuilder:token'); } catch { /* ignore */ }

  // Pre-populate localStorage — a fallback implementation would return this
  localStorage.setItem(
    'dappbuilder:saved_apps',
    JSON.stringify([makeEditingApp({ dappName: 'Fallback App' })]),
  );

  const app = makeEditingApp({ dappName: 'New App' });
  await expect(realSaveApp(app)).rejects.toBeInstanceOf(AuthError);

  // Confirm localStorage was not modified
  const raw = JSON.parse(localStorage.getItem('dappbuilder:saved_apps')!);
  expect(raw).toHaveLength(1);
  expect(raw[0].dappName).toBe('Fallback App');
});
