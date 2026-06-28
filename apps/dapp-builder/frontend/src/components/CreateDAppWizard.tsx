import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, ArrowRight, Sparkles, Check, Loader, Save, ExternalLink, Zap,
} from 'lucide-react';
import { Template, WorkflowBlock, SavedDApp, ProjectStatus } from '../types';
import { buildConfig } from '../lib/buildConfig';
import { generateDAppCode } from '../lib/generateCode';
import { saveApp, updateApp } from '../services/storage';
import { WORKFLOW_BLOCKS, TEMPLATE_DEFAULT_BLOCKS, DEMO_USERS, API_COMPONENTS } from '../data';
import { WorkflowBuilder } from './WorkflowBuilder';

const LOADING_MESSAGES = [
  'Generating your app...',
  'Wiring up the workflow blocks...',
  'Connecting API services...',
  'Almost there...',
];

const MAX_PROMPT_WORDS = 1000;

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

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
  1: 'Describe your app',
  2: 'Build Workflow & APIs',
  3: 'Preview & Create',
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
  const [userPrompt, setUserPrompt] = useState(editingApp?.userPrompt ?? '');
  const [selectedApis, setSelectedApis] = useState<string[]>(
    editingApp?.apis ?? [...template.apiIds]
  );
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(
    editingApp?.generatedCode || null
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [localKey, setLocalKey] = useState(apiKey);
  const [savedConfirmation, setSavedConfirmation] = useState<string | null>(null);
  const [lastSavedApp, setLastSavedApp] = useState<SavedDApp | null>(null);

  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const promptWordCount = countWords(userPrompt);
  const promptOverLimit = promptWordCount > MAX_PROMPT_WORDS;

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

  const toggleApi = (id: string) => {
    setSelectedApis((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Derive a short display name for the API chip
  const apiChipLabel = (name: string) =>
    name
      .replace(' (Placeholder)', '')
      .replace(' Adapter API', ' Adapter')
      .replace(' API', '');

  // Config uses selectedApis (overrides template defaults).
  const config = buildConfig(template, workflowSteps, dappName);
  const effectiveApis = selectedApis.length > 0 ? selectedApis : config.apis;

  // Build and persist the saved app object.
  const persistApp = (
    status: ProjectStatus,
    code: string | null,
    opts?: { overrideId?: string }
  ): SavedDApp => {
    const now = new Date().toISOString();
    const effectiveName = dappName.trim() || (template.id === 'custom' ? 'My Custom App' : `My ${template.name}`);
    const ownerUser = DEMO_USERS.find((u) => u.email === currentUserEmail);

    const id = opts?.overrideId ?? (editingApp?.id ?? `dapp_${crypto.randomUUID()}`);
    const internalAppPath = `/dapp-builder/apps/${id}`;

    const generatedConfigObj = {
      appName: effectiveName,
      userPrompt: userPrompt.trim() || description,
      template: config.template,
      selectedApis: effectiveApis,
      workflowBlocks: config.workflow,
      permissionModel: config.permissionModel,
      runtimeMode: 'frontend-mock',
      internalAppPath,
    };

    if (editingApp) {
      const updated: SavedDApp = {
        ...editingApp,
        dappName: effectiveName,
        description,
        userPrompt: userPrompt.trim() || editingApp.userPrompt,
        generatedConfig: JSON.stringify(generatedConfigObj, null, 2),
        internalAppPath,
        template: config.template,
        permissionModel: config.permissionModel,
        apis: effectiveApis,
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
        id,
        dappName: effectiveName,
        description,
        userPrompt: userPrompt.trim(),
        generatedConfig: JSON.stringify(generatedConfigObj, null, 2),
        internalAppPath,
        template: config.template,
        permissionModel: config.permissionModel,
        apis: effectiveApis,
        workflow: config.workflow,
        generatedCode: code ?? '',
        createdAt: now,
        updatedAt: now,
        sharedWith: [],
        sharedAccess: [],
        ownerId: currentUserEmail ?? '',
        ownerName: ownerUser?.name ?? '',
        status,
        version: 1,
      };
      saveApp(newApp);
      return newApp;
    }
  };

  // "Create App" — saves immediately (no generated code), opens app runtime.
  const handleCreateApp = () => {
    if (promptOverLimit) {
      setGenError(`Please keep the app prompt under ${MAX_PROMPT_WORDS} words (currently ${promptWordCount}).`);
      return;
    }
    const effectiveName = dappName.trim() || (template.id === 'custom' ? 'My Custom App' : `My ${template.name}`);
    if (!dappName.trim()) setDappName(effectiveName);

    // Auto-populate workflow from template defaults if empty
    let effectiveBlocks = workflowSteps;
    if (workflowSteps.length === 0 && template.id !== 'custom') {
      const defaultBlockIds = TEMPLATE_DEFAULT_BLOCKS[template.id] ?? [];
      effectiveBlocks = WORKFLOW_BLOCKS.filter((b) => defaultBlockIds.includes(b.id));
      onWorkflowChange(effectiveBlocks);
    }

    const effectiveConfig = buildConfig(template, effectiveBlocks, effectiveName);
    const now = new Date().toISOString();
    const ownerUser = DEMO_USERS.find((u) => u.email === currentUserEmail);
    const id = editingApp?.id ?? `dapp_${crypto.randomUUID()}`;
    const internalAppPath = `/dapp-builder/apps/${id}`;
    const apis = selectedApis.length > 0 ? selectedApis : effectiveConfig.apis;

    const generatedConfigObj = {
      appName: effectiveName,
      userPrompt: userPrompt.trim() || description,
      template: effectiveConfig.template,
      selectedApis: apis,
      workflowBlocks: effectiveConfig.workflow,
      permissionModel: effectiveConfig.permissionModel,
      runtimeMode: 'frontend-mock',
      internalAppPath,
    };

    let app: SavedDApp;
    if (editingApp) {
      app = {
        ...editingApp,
        dappName: effectiveName,
        description,
        userPrompt: userPrompt.trim() || editingApp.userPrompt,
        generatedConfig: JSON.stringify(generatedConfigObj, null, 2),
        internalAppPath,
        template: effectiveConfig.template,
        permissionModel: effectiveConfig.permissionModel,
        apis,
        workflow: effectiveConfig.workflow,
        updatedAt: now,
        status: editingApp.sharedWith.length > 0 ? 'Shared' : 'Saved',
        version: (editingApp.version ?? 0) + 1,
      };
      updateApp(editingApp.id, app);
    } else {
      app = {
        id,
        dappName: effectiveName,
        description,
        userPrompt: userPrompt.trim(),
        generatedConfig: JSON.stringify(generatedConfigObj, null, 2),
        internalAppPath,
        template: effectiveConfig.template,
        permissionModel: effectiveConfig.permissionModel,
        apis,
        workflow: effectiveConfig.workflow,
        generatedCode: '',
        createdAt: now,
        updatedAt: now,
        sharedWith: [],
        sharedAccess: [],
        ownerId: currentUserEmail ?? '',
        ownerName: ownerUser?.name ?? '',
        status: 'Saved',
        version: 1,
      };
      saveApp(app);
    }

    setLastSavedApp(app);
    onSaveApp?.();
    onCreateSuccess?.(app);
  };

  const handleGenerate = async () => {
    if (promptOverLimit) {
      setGenError(`Please keep the app prompt under ${MAX_PROMPT_WORDS} words (currently ${promptWordCount}).`);
      return;
    }
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
          apis: effectiveApis,
          workflow: config.workflow,
          userPrompt,
        },
        key
      );

      setGeneratedCode(html);

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

  const handleOpenApp = () => {
    if (lastSavedApp && onCreateSuccess) {
      onCreateSuccess(lastSavedApp);
    }
  };

  return (
    <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wizard-modal" role="dialog" aria-modal="true" aria-label="Create app wizard">

        {/* Header */}
        <div className="wizard-header">
          <div>
            <div className="wizard-header-kicker">
              {editingApp ? 'Edit App' : 'Create App'} — {template.name}
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

          {/* ── Step 1: Name + Prompt + APIs ── */}
          {wizardStep === 1 && (
            <div className="wizard-step-content">
              {template.id === 'custom' ? (
                <div className="wizard-template-reminder wizard-template-reminder--scratch">
                  <strong>Building from scratch</strong>
                  <p>Describe what you want to build — the runtime will be inferred from your prompt and selected APIs.</p>
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

              {/* App name */}
              <div className="wizard-field">
                <label className="wizard-field-label" htmlFor="wizard-dapp-name">App name</label>
                <input
                  id="wizard-dapp-name"
                  className="wizard-input"
                  type="text"
                  value={dappName}
                  onChange={(e) => setDappName(e.target.value)}
                  placeholder={template.id === 'custom' ? 'Give your app a name…' : `e.g. My ${template.name}`}
                  autoFocus
                />
                <div className="wizard-field-hint">
                  Shown in the library, runtime header, and generated code.
                </div>
              </div>

              {/* Short description */}
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
                  placeholder="What does this app do? (shown on library card)"
                />
              </div>

              {/* Full prompt */}
              <div className="wizard-field">
                <label className="wizard-field-label" htmlFor="wizard-user-prompt">
                  Describe the app you want to build
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (up to {MAX_PROMPT_WORDS.toLocaleString()} words)</span>
                </label>
                <textarea
                  id="wizard-user-prompt"
                  className={`wizard-prompt-textarea${promptOverLimit ? ' wizard-prompt-textarea--over' : ''}`}
                  rows={5}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={
                    template.id === 'custom'
                      ? 'e.g. An app that plans outfits based on the weather. User enters their city, the app shows current conditions and temperature, then generates an outfit recommendation for the day based on weather and occasion.'
                      : `e.g. Show a live token balance, allow the user to submit a transfer request, and display a transaction history table with filters.`
                  }
                />
                <div className={`wizard-word-count${promptOverLimit ? ' wizard-word-count--over' : ''}`}>
                  {promptWordCount.toLocaleString()} / {MAX_PROMPT_WORDS.toLocaleString()} words
                  {promptOverLimit && ' — please shorten your prompt before saving'}
                </div>
              </div>

            </div>
          )}

          {/* ── Step 2: Workflow + APIs ── */}
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

              {/* API picker — moved here from step 1 */}
              <div className="wizard-field" style={{ marginTop: '24px' }}>
                <label className="wizard-field-label">APIs to include</label>
                <div className="wizard-api-picker">
                  {API_COMPONENTS.map((api) => (
                    <button
                      key={api.id}
                      type="button"
                      className={`wizard-api-chip${selectedApis.includes(api.id) ? ' selected' : ''}`}
                      onClick={() => toggleApi(api.id)}
                      title={api.purpose}
                    >
                      {apiChipLabel(api.name)}
                    </button>
                  ))}
                </div>
                <div className="wizard-field-hint">
                  {selectedApis.length} API{selectedApis.length !== 1 ? 's' : ''} selected
                  {selectedApis.length > 0 && ` · ${selectedApis.join(', ')}`}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Preview & Create ── */}
          {wizardStep === 3 && (
            <div className="wizard-step-content">
              {/* App summary (user-facing, no internal fields) */}
              <div className="wizard-config-recap">
                <div className="config-panel-header">
                  <span className="config-panel-label">Your app</span>
                  <span className="config-live-badge">Ready to generate</span>
                </div>
                <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#c4daf5' }}>
                  <div><span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Name</span> {config.dappName || '—'}</div>
                  <div><span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Template</span> {config.template || '—'}</div>
                  {effectiveApis.length > 0 && (
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>APIs</span> {effectiveApis.join(', ')}</div>
                  )}
                  {config.workflow.length > 0 && (
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Workflow</span> {config.workflow.join(' → ')}</div>
                  )}
                </div>
              </div>

              {/* Show prompt over-limit warning if user skipped step 1 */}
              {promptOverLimit && (
                <div className="wizard-gen-error">
                  Prompt is {promptWordCount.toLocaleString()} words — please go back and shorten it to under {MAX_PROMPT_WORDS.toLocaleString()} words before generating.
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
                  disabled={generating || !localKey.trim() || promptOverLimit}
                >
                  {generating ? (
                    <><Loader size={15} className="spin" />{loadingMsg}</>
                  ) : (
                    <><Sparkles size={15} />Generate App</>
                  )}
                </button>
              )}

              {/* Error */}
              {genError && (
                <div className="wizard-gen-error">
                  <strong>We couldn't generate the app preview.</strong> {genError}
                  {!promptOverLimit && (
                    <button
                      style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#ff8855', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', textDecoration: 'underline' }}
                      onClick={() => { setGenError(null); handleGenerate(); }}
                    >
                      Try again
                    </button>
                  )}
                </div>
              )}

              {/* Generated output */}
              {generatedCode && (
                <div className="wizard-code-output">
                  <div className="codegen-iframe-section">
                    <div className="codegen-iframe-header">
                      <span className="code-block-label">Live App</span>
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
                      title={`${config.dappName} live app`}
                      sandbox="allow-scripts allow-popups allow-forms allow-modals"
                      style={{ width: '100%', minHeight: '500px', border: 'none', borderRadius: '8px' }}
                    />
                  </div>

                  {savedConfirmation && (
                    <div className="save-toast" style={{ marginTop: '12px' }}>
                      <Check size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Your app is ready — <strong>{savedConfirmation}</strong> has been saved to My Library
                    </div>
                  )}
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
              <button className="wizard-nav-btn wizard-nav-btn--back" onClick={handleRegenerate}>
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
                  <button className="wizard-create-btn" onClick={handleOpenApp}>
                    <Zap size={14} />
                    Create App
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
                  title="Save to library as a draft"
                >
                  <Save size={13} />
                  Save Draft
                </button>
                {/* "Create App" is only available on the final step (step 3) after generation */}
                <button
                  className="wizard-nav-btn wizard-nav-btn--next"
                  onClick={() => onStepChange((wizardStep + 1) as 2 | 3)}
                  disabled={wizardStep === 2 && workflowSteps.length === 0 && template.id !== 'custom'}
                >
                  {wizardStep === 1 ? 'Next: Build Workflow' : 'Next: Preview & Create'}
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
