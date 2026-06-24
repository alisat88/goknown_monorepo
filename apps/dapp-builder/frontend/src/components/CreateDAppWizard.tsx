import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, ArrowRight, Sparkles, Copy, Check, Loader, Save, ExternalLink, Eye, Zap,
} from 'lucide-react';
import { Template, WorkflowBlock, SavedDApp, ProjectStatus } from '../types';
import { buildConfig } from '../lib/buildConfig';
import { generateDAppCode } from '../lib/generateCode';
import { saveApp, updateApp } from '../services/storage';
import { WORKFLOW_BLOCKS, TEMPLATE_DEFAULT_BLOCKS, DEMO_USERS } from '../data';
import { WorkflowBuilder } from './WorkflowBuilder';

const LOADING_MESSAGES = [
  'Generating your dApp...',
  'Wiring up the workflow blocks...',
  'Connecting API services...',
  'Almost there...',
];

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const status = msg.split(':')[0];
  if (status === '401') return 'Invalid API key — check your key and try again';
  if (status === '429') return 'Rate limit reached — wait a moment and try again';
  if (
    msg.toLowerCase().includes('failed to fetch') ||
    msg.toLowerCase().includes('networkerror') ||
    msg.toLowerCase().includes('network error')
  ) {
    return 'Network error — check your connection and try again';
  }
  return msg.includes(':') ? msg.split(':').slice(1).join(':').trim() || msg : msg;
}

interface Props {
  template: Template;
  workflowSteps: WorkflowBlock[];
  onWorkflowChange: (steps: WorkflowBlock[]) => void;
  wizardStep: 1 | 2 | 3;
  onStepChange: (s: 1 | 2 | 3) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onClose: () => void;
  editingApp?: SavedDApp;
  onSaveApp?: () => void;
  onGoToLibrary?: () => void;
  onCreateSuccess?: (app: SavedDApp) => void;
  currentUserEmail?: string;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="wizard-steps">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <React.Fragment key={n}>
          <div className={`wizard-step-dot${n === current ? ' active' : n < current ? ' done' : ''}`}>
            {n < current ? <Check size={11} /> : n}
          </div>
          {n < total && <div className="wizard-step-connector" />}
        </React.Fragment>
      ))}
    </div>
  );
}

const STEP_LABELS: Record<number, string> = {
  1: 'Name your dApp',
  2: 'Build your workflow',
  3: 'Generate & preview',
};

export function CreateDAppWizard({
  template,
  workflowSteps,
  onWorkflowChange,
  wizardStep,
  onStepChange,
  apiKey,
  onApiKeyChange,
  onClose,
  editingApp,
  onSaveApp,
  onGoToLibrary,
  onCreateSuccess,
  currentUserEmail,
}: Props) {
  const [dappName, setDappName] = useState(
    editingApp?.dappName ?? (template.id === 'custom' ? '' : `My ${template.name}`)
  );
  const [description, setDescription] = useState(editingApp?.description ?? '');
  const [userPrompt, setUserPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(
    editingApp?.generatedCode || null
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [savedConfirmation, setSavedConfirmation] = useState<string | null>(null);
  const [lastSavedApp, setLastSavedApp] = useState<SavedDApp | null>(null);

  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current); };
  }, []);

  useEffect(() => { setLocalKey(apiKey); }, [apiKey]);

  const handleKeyChange = (k: string) => {
    setLocalKey(k);
    onApiKeyChange(k);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Current config derived from wizard state (used for step 3 recap and persistence).
  const config = buildConfig(template, workflowSteps, dappName);

  // Core persistence — builds and saves the app with the given status and code.
  // Uses `workflowSteps` from props directly (caller must ensure they're populated).
  const persistApp = (status: ProjectStatus, code: string | null): SavedDApp => {
    const now = new Date().toISOString();
    const effectiveName = dappName.trim() || (template.id === 'custom' ? 'My Custom dApp' : `My ${template.name}`);
    const ownerUser = DEMO_USERS.find((u) => u.email === currentUserEmail);

    if (editingApp) {
      const updated: SavedDApp = {
        ...editingApp,
        dappName: effectiveName,
        description,
        template: config.template,
        permissionModel: config.permissionModel,
        apis: config.apis,
        workflow: config.workflow,
        generatedCode: code !== null ? code : editingApp.generatedCode,
        updatedAt: now,
        status: editingApp.sharedWith.length > 0 ? 'Shared' : status,
        ownerName: editingApp.ownerName,
        version: (editingApp.version ?? 0) + 1,
      };
      updateApp(editingApp.id, updated);
      return updated;
    } else {
      const newApp: SavedDApp = {
        id: `dapp_${crypto.randomUUID()}`,
        dappName: effectiveName,
        description,
        template: config.template,
        permissionModel: config.permissionModel,
        apis: config.apis,
        workflow: config.workflow,
        generatedCode: code ?? '',
        createdAt: now,
        updatedAt: now,
        sharedWith: [],
        sharedAccess: [],
        ownerId: currentUserEmail ?? 'alisa@goknown.io',
        ownerName: ownerUser?.name ?? 'Alisa',
        status,
        version: 1,
      };
      saveApp(newApp);
      return newApp;
    }
  };

  // "Create dApp" — saves immediately (no code), opens preview.
  const handleCreateDApp = () => {
    const effectiveName = dappName.trim() || (template.id === 'custom' ? 'My Custom dApp' : `My ${template.name}`);
    if (!dappName.trim()) setDappName(effectiveName);

    // Auto-populate workflow from template defaults if empty
    let effectiveBlocks = workflowSteps;
    if (workflowSteps.length === 0 && template.id !== 'custom') {
      const defaultBlockIds = TEMPLATE_DEFAULT_BLOCKS[template.id] ?? [];
      effectiveBlocks = WORKFLOW_BLOCKS.filter((b) => defaultBlockIds.includes(b.id));
      onWorkflowChange(effectiveBlocks);
    }

    // Build config from the effective (possibly auto-populated) blocks
    const effectiveConfig = buildConfig(template, effectiveBlocks, effectiveName);
    const now = new Date().toISOString();
    const ownerUser = DEMO_USERS.find((u) => u.email === currentUserEmail);

    let app: SavedDApp;
    if (editingApp) {
      app = {
        ...editingApp,
        dappName: effectiveName,
        description,
        template: effectiveConfig.template,
        permissionModel: effectiveConfig.permissionModel,
        apis: effectiveConfig.apis,
        workflow: effectiveConfig.workflow,
        updatedAt: now,
        status: editingApp.sharedWith.length > 0 ? 'Shared' : 'Preview Ready',
        version: (editingApp.version ?? 0) + 1,
      };
      updateApp(editingApp.id, app);
    } else {
      app = {
        id: `dapp_${crypto.randomUUID()}`,
        dappName: effectiveName,
        description,
        template: effectiveConfig.template,
        permissionModel: effectiveConfig.permissionModel,
        apis: effectiveConfig.apis,
        workflow: effectiveConfig.workflow,
        generatedCode: '',
        createdAt: now,
        updatedAt: now,
        sharedWith: [],
        sharedAccess: [],
        ownerId: currentUserEmail ?? 'alisa@goknown.io',
        ownerName: ownerUser?.name ?? 'Alisa',
        status: 'Preview Ready',
        version: 1,
      };
      saveApp(app);
    }

    setLastSavedApp(app);
    onSaveApp?.();
    onCreateSuccess?.(app);
  };

  const handleGenerate = async () => {
    const key = localKey.trim();
    if (!key) return;

    setGenerating(true);
    setGenError(null);
    setGeneratedCode(null);
    setSavedConfirmation(null);
    setLoadingMsg(LOADING_MESSAGES[0]);

    let msgIdx = 0;
    loadingIntervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2000);

    try {
      const html = await generateDAppCode(
        {
          dappName: config.dappName,
          template: config.template,
          apis: config.apis,
          workflow: config.workflow,
          userPrompt,
        },
        key
      );

      setGeneratedCode(html);

      // Auto-save after successful generation
      // TODO (production): Replace with POST /api/dapps
      const saved = persistApp('Generated', html);
      setLastSavedApp(saved);
      onSaveApp?.();
      setSavedConfirmation(saved.dappName);
    } catch (err) {
      setGenError(classifyError(err));
    } finally {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedCode(null);
    setGenError(null);
    setSavedConfirmation(null);
    setLastSavedApp(null);
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveDraft = () => {
    const app = persistApp('Draft', null);
    setLastSavedApp(app);
    onSaveApp?.();
    setSavedConfirmation(app.dappName);
    setTimeout(() => {
      setSavedConfirmation(null);
      onClose();
    }, 1500);
  };

  const handleOpenPreview = () => {
    if (lastSavedApp && onCreateSuccess) {
      onCreateSuccess(lastSavedApp);
    }
  };

  return (
    <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wizard-modal" role="dialog" aria-modal="true" aria-label="Create dApp wizard">

        {/* Header */}
        <div className="wizard-header">
          <div>
            <div className="wizard-header-kicker">
              {editingApp ? 'Edit dApp' : 'Create dApp'} — {template.name}
            </div>
            <div className="wizard-header-title">{STEP_LABELS[wizardStep]}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <StepIndicator current={wizardStep} total={3} />
            <button className="wizard-close-btn" onClick={onClose} aria-label="Close wizard">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="wizard-body">

          {/* ── Step 1: Name + Description ── */}
          {wizardStep === 1 && (
            <div className="wizard-step-content">
              {template.id === 'custom' ? (
                <div className="wizard-template-reminder wizard-template-reminder--scratch">
                  <strong>Building from scratch</strong>
                  <p>You're building from scratch. Name your dApp and choose workflow blocks on the next screen.</p>
                </div>
              ) : (
                <div className="wizard-template-reminder">
                  <strong>{template.name}</strong>
                  <p>{template.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {template.includedComponents.map((c) => (
                      <span key={c} className="component-chip">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="wizard-field">
                <label className="wizard-field-label" htmlFor="wizard-dapp-name">dApp name</label>
                <input
                  id="wizard-dapp-name"
                  className="wizard-input"
                  type="text"
                  value={dappName}
                  onChange={(e) => setDappName(e.target.value)}
                  placeholder={template.id === 'custom' ? 'Give your dApp a name…' : `e.g. My ${template.name}`}
                  autoFocus
                />
                <div className="wizard-field-hint">
                  This name appears in the generated code, config, and library.
                </div>
              </div>

              <div className="wizard-field">
                <label className="wizard-field-label" htmlFor="wizard-dapp-desc">
                  Short description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="wizard-dapp-desc"
                  className="wizard-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this dApp do?"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Workflow ── */}
          {wizardStep === 2 && (
            <div className="wizard-step-content">
              {template.id === 'custom' && (
                <div className="wizard-scratch-hint">
                  Blank canvas — add any workflow blocks that fit your use case.
                </div>
              )}
              <WorkflowBuilder
                workflowSteps={workflowSteps}
                onWorkflowChange={onWorkflowChange}
                selectedTemplate={template}
              />
            </div>
          )}

          {/* ── Step 3: Generate ── */}
          {wizardStep === 3 && (
            <div className="wizard-step-content">
              {/* Config recap */}
              <div className="wizard-config-recap">
                <div className="config-panel-header">
                  <span className="config-panel-label">dapp.config.json</span>
                  <span className="config-live-badge">Live</span>
                </div>
                <pre className="config-json" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>

              {/* Custom prompt — shown before generation */}
              {!generatedCode && (
                <div className="codegen-prompt-field">
                  <label className="wizard-field-label" htmlFor="wizard-user-prompt">
                    Describe what you want your dApp to do <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    id="wizard-user-prompt"
                    className="codegen-prompt-textarea"
                    rows={4}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="e.g. Show a live token balance, allow the user to submit a transfer request, display a transaction history table with filters"
                  />
                </div>
              )}

              {/* API key input */}
              {!localKey.trim() && (
                <div className="api-key-input-wrap">
                  <label className="wizard-field-label" htmlFor="wizard-api-key">Anthropic API key</label>
                  <input
                    id="wizard-api-key"
                    className="wizard-input wizard-input--key"
                    type="password"
                    value={localKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder="Paste your Anthropic API key to enable code generation"
                    autoComplete="off"
                  />
                  <div className="wizard-field-hint">
                    Key is held in memory only — never stored or sent anywhere except the Anthropic API.
                  </div>
                </div>
              )}

              {/* Generate button */}
              {!generatedCode && (
                <button
                  className="wizard-generate-btn"
                  onClick={handleGenerate}
                  disabled={generating || !localKey.trim()}
                >
                  {generating ? (
                    <><Loader size={15} className="spin" />{loadingMsg}</>
                  ) : (
                    <><Sparkles size={15} />Generate Code</>
                  )}
                </button>
              )}

              {/* Error */}
              {genError && (
                <div className="wizard-gen-error">
                  <strong>Error:</strong> {genError}
                  <button
                    style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#ff8855', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', textDecoration: 'underline' }}
                    onClick={() => { setGenError(null); handleGenerate(); }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Generated output */}
              {generatedCode && (
                <div className="wizard-code-output">
                  <div className="codegen-iframe-section">
                    <div className="codegen-iframe-header">
                      <span className="code-block-label">Live Preview</span>
                      <button
                        className="open-newtab-btn"
                        onClick={() => {
                          const url = URL.createObjectURL(new Blob([generatedCode], { type: 'text/html' }));
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                        }}
                      >
                        <ExternalLink size={13} />
                        Open in new tab
                      </button>
                    </div>
                    <iframe
                      srcDoc={generatedCode}
                      className="codegen-iframe"
                      title={`${config.dappName} live preview`}
                      sandbox="allow-scripts allow-popups allow-forms allow-modals"
                      style={{ width: '100%', minHeight: '500px', border: 'none', borderRadius: '8px' }}
                    />
                  </div>

                  {savedConfirmation && (
                    <div className="save-toast" style={{ marginTop: '12px' }}>
                      ✓ Saved to My Library as <strong>{savedConfirmation}</strong>
                    </div>
                  )}

                  <div className="wizard-code-header" style={{ marginTop: '20px' }}>
                    <span className="code-block-label">Generated HTML</span>
                    <button className="wizard-copy-btn" onClick={handleCopy}>
                      {copied ? <><Check size={13} /> Copied ✓</> : <><Copy size={13} /> Copy code</>}
                    </button>
                  </div>
                  <pre className="wizard-code-pre">{generatedCode}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="wizard-footer">

          {/* ── Step 3 footer: after code generation ── */}
          {wizardStep === 3 && savedConfirmation && (
            <>
              <button
                className="wizard-nav-btn wizard-nav-btn--back"
                onClick={handleRegenerate}
              >
                ↺ Regenerate
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="wizard-nav-btn wizard-nav-btn--next"
                  onClick={onGoToLibrary ?? onClose}
                >
                  Go to Library →
                </button>
                {onCreateSuccess && lastSavedApp && (
                  <button className="wizard-create-btn" onClick={handleOpenPreview}>
                    <Eye size={14} />
                    Open Preview
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Step 3 footer: before generation or while generating ── */}
          {wizardStep === 3 && !savedConfirmation && (
            <button
              className="wizard-nav-btn wizard-nav-btn--back"
              onClick={() => onStepChange(2)}
            >
              ← Back
            </button>
          )}

          {/* ── Steps 1 & 2 footer ── */}
          {wizardStep < 3 && (
            <>
              <button
                className="wizard-nav-btn wizard-nav-btn--back"
                onClick={() => wizardStep > 1 ? onStepChange((wizardStep - 1) as 1 | 2) : onClose()}
              >
                {wizardStep === 1 ? 'Cancel' : '← Back'}
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="wizard-nav-btn wizard-nav-btn--save-draft"
                  onClick={handleSaveDraft}
                  title="Save to library as a draft — no preview yet"
                >
                  <Save size={13} />
                  Save Draft
                </button>
                <button
                  className="wizard-create-btn"
                  onClick={handleCreateDApp}
                  title="Create the dApp now — opens preview immediately"
                >
                  <Zap size={14} />
                  Create dApp
                </button>
                <button
                  className="wizard-nav-btn wizard-nav-btn--next"
                  onClick={() => onStepChange((wizardStep + 1) as 2 | 3)}
                  disabled={wizardStep === 2 && workflowSteps.length === 0 && template.id !== 'custom'}
                >
                  {wizardStep === 1 ? 'Next: Build Workflow' : 'Next: Generate Code'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
