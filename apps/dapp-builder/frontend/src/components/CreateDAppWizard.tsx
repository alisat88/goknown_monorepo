import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, Sparkles, Copy, Check, Loader, Save, BookMarked } from 'lucide-react';
import { Template, WorkflowBlock, SavedDApp } from '../types';
import { buildConfig } from '../lib/buildConfig';
import { generateDAppCode } from '../lib/generateCode';
import { saveApp, updateApp } from '../services/storage';
import { WorkflowBuilder } from './WorkflowBuilder';

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
  3: 'Generate code',
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
}: Props) {
  const [dappName, setDappName] = useState(
    editingApp?.dappName ?? (template.id === 'custom' ? '' : `My ${template.name}`)
  );
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(
    editingApp?.generatedCode || null
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [savedConfirmation, setSavedConfirmation] = useState<string | null>(null);

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

  const handleGenerate = async () => {
    const key = localKey.trim();
    if (!key) return;
    setGenerating(true);
    setGenError(null);
    setGeneratedCode(null);
    try {
      const code = await generateDAppCode(template, workflowSteps, dappName, key);
      setGeneratedCode(code);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const config = buildConfig(template, workflowSteps, dappName);

  const persistApp = (isDraft: boolean, code: string | null): SavedDApp => {
    const now = new Date().toISOString();
    if (editingApp) {
      const updated: SavedDApp = {
        ...editingApp,
        dappName: dappName || 'Untitled dApp',
        template: config.template,
        permissionModel: config.permissionModel,
        apis: config.apis,
        workflow: config.workflow,
        generatedCode: isDraft ? editingApp.generatedCode : (code ?? editingApp.generatedCode),
        updatedAt: now,
        status: isDraft ? editingApp.status : 'Preview',
      };
      updateApp(editingApp.id, updated);
      return updated;
    } else {
      const newApp: SavedDApp = {
        id: crypto.randomUUID(),
        dappName: dappName || 'Untitled dApp',
        template: config.template,
        permissionModel: config.permissionModel,
        apis: config.apis,
        workflow: config.workflow,
        generatedCode: isDraft ? '' : (code ?? ''),
        createdAt: now,
        updatedAt: now,
        sharedWith: [],
        status: isDraft ? 'Draft' : 'Preview',
      };
      saveApp(newApp);
      return newApp;
    }
  };

  const handleSaveDraft = () => {
    const app = persistApp(true, null);
    onSaveApp?.();
    setSavedConfirmation(app.dappName);
    setTimeout(() => {
      setSavedConfirmation(null);
      onClose();
    }, 1500);
  };

  const handleSaveToLibrary = () => {
    const app = persistApp(false, generatedCode);
    onSaveApp?.();
    setSavedConfirmation(app.dappName);
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

          {/* Step 1 — Name */}
          {wizardStep === 1 && (
            <div className="wizard-step-content">
              {template.id === 'custom' ? (
                <div className="wizard-template-reminder wizard-template-reminder--scratch">
                  <strong>Building from scratch</strong>
                  <p>
                    You're building from scratch. Name your dApp and then choose whichever
                    workflow blocks fit your use case.
                  </p>
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
                <label className="wizard-field-label" htmlFor="wizard-dapp-name">
                  dApp name
                </label>
                <input
                  id="wizard-dapp-name"
                  className="wizard-input"
                  type="text"
                  value={dappName}
                  onChange={(e) => setDappName(e.target.value)}
                  placeholder={template.id === 'custom' ? 'Give your dApp a name…' : 'e.g. Aviation Ledger App'}
                  autoFocus
                />
                <div className="wizard-field-hint">
                  This name appears in the generated code and config.
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Workflow */}
          {wizardStep === 2 && (
            <div className="wizard-step-content">
              {template.id === 'custom' && (
                <div className="wizard-scratch-hint">
                  This is your blank canvas. Add any workflow blocks you need — there's no wrong starting point.
                </div>
              )}
              <WorkflowBuilder
                workflowSteps={workflowSteps}
                onWorkflowChange={onWorkflowChange}
                selectedTemplate={template}
              />
            </div>
          )}

          {/* Step 3 — Generate */}
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

              {/* API key input */}
              {!localKey.trim() && (
                <div className="api-key-input-wrap">
                  <label className="wizard-field-label" htmlFor="wizard-api-key">
                    Anthropic API key
                  </label>
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
                    <>
                      <Loader size={15} className="spin" />
                      Generating your dApp code…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Generate Code
                    </>
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

              {/* Generated code */}
              {generatedCode && (
                <div className="wizard-code-output">
                  <div className="wizard-code-header">
                    <span className="code-block-label">Generated TypeScript / React</span>
                    <button className="wizard-copy-btn" onClick={handleCopy}>
                      {copied ? <><Check size={13} /> Copied ✓</> : <><Copy size={13} /> Copy code</>}
                    </button>
                  </div>
                  <pre className="wizard-code-pre">{generatedCode}</pre>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                    <button
                      className="wizard-generate-btn"
                      style={{ background: 'rgba(38,184,255,0.06)' }}
                      onClick={() => { setGeneratedCode(null); setGenError(null); setSavedConfirmation(null); }}
                    >
                      <Sparkles size={14} />
                      Regenerate
                    </button>
                    {!savedConfirmation && (
                      <button className="wizard-save-btn" onClick={handleSaveToLibrary}>
                        <BookMarked size={14} />
                        Save to My Library
                      </button>
                    )}
                  </div>

                  {savedConfirmation && (
                    <div className="save-toast">
                      ✓ <strong>{savedConfirmation}</strong> saved to your library
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="wizard-footer">
          {savedConfirmation && wizardStep === 3 ? (
            <button
              className="wizard-nav-btn wizard-nav-btn--next"
              onClick={onGoToLibrary ?? onClose}
              style={{ marginLeft: 'auto' }}
            >
              Go to My Library →
            </button>
          ) : (
            <>
              <button
                className="wizard-nav-btn wizard-nav-btn--back"
                onClick={() => wizardStep > 1 ? onStepChange((wizardStep - 1) as 1 | 2 | 3) : onClose()}
              >
                {wizardStep === 1 ? 'Cancel' : '← Back'}
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {wizardStep < 3 && (
                  <button
                    className="wizard-nav-btn wizard-nav-btn--save-draft"
                    onClick={handleSaveDraft}
                  >
                    <Save size={13} />
                    Save as Draft
                  </button>
                )}
                {wizardStep < 3 && (
                  <button
                    className="wizard-nav-btn wizard-nav-btn--next"
                    onClick={() => onStepChange((wizardStep + 1) as 2 | 3)}
                    disabled={wizardStep === 2 && workflowSteps.length === 0 && template.id !== 'custom'}
                  >
                    {wizardStep === 1 ? 'Next: Build Workflow' : 'Next: Generate Code'}
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
