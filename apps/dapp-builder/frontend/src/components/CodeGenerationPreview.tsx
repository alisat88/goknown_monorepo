import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Copy, Check, Loader, ExternalLink } from 'lucide-react';
import { Template, WorkflowBlock, SavedDApp } from '../types';
import { buildConfig } from '../lib/buildConfig';
import { generateDAppCode } from '../lib/generateCode';
import { saveApp, updateApp } from '../services/storage';

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
  selectedTemplate: Template | null;
  workflowSteps: WorkflowBlock[];
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onSaveApp?: () => void;
}

export function CodeGenerationPreview({
  selectedTemplate,
  workflowSteps,
  apiKey,
  onApiKeyChange,
  onSaveApp,
}: Props) {
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState<string | null>(null);
  const [localKey, setLocalKey] = useState(apiKey);

  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, []);

  useEffect(() => { setLocalKey(apiKey); }, [apiKey]);

  const handleKeyChange = (k: string) => {
    setLocalKey(k);
    onApiKeyChange(k);
  };

  const config = buildConfig(selectedTemplate, workflowSteps);

  const handleGenerate = async () => {
    const key = localKey.trim();
    if (!key || !selectedTemplate) return;

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

      // Auto-save to library immediately after successful generation
      // TODO (production): Replace with POST /api/dapps or PUT /api/dapps/:id
      const now = new Date().toISOString();
      const existingApps: SavedDApp[] = (() => {
        try {
          const raw = localStorage.getItem('dappbuilder:saved_apps');
          return raw ? (JSON.parse(raw) as SavedDApp[]) : [];
        } catch { return []; }
      })();
      const existing = existingApps.find(
        (a) => a.dappName === config.dappName && a.template === config.template
      );
      if (existing) {
        updateApp(existing.id, { generatedCode: html, apis: config.apis, workflow: config.workflow, status: 'Preview' });
      } else {
        saveApp({
          id: crypto.randomUUID(),
          dappName: config.dappName,
          template: config.template,
          permissionModel: config.permissionModel,
          apis: config.apis,
          workflow: config.workflow,
          generatedCode: html,
          createdAt: now,
          updatedAt: now,
          sharedWith: [],
          status: 'Preview',
        });
      }
      onSaveApp?.();
      setSavedConfirmation(config.dappName);
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
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">AI-Assisted Code Generation</p>
        <h2 className="pane-title">Generate dApp code</h2>
        <p className="pane-desc">
          Select a template, build a workflow, then generate a live interactive dApp from your
          config. The result renders directly in the browser — no downloads required.
        </p>
      </div>

      {/* Active config */}
      <div className="wizard-config-recap" style={{ marginBottom: '24px' }}>
        <div className="config-panel-header">
          <span className="config-panel-label">Active config</span>
          <span className="config-live-badge">Live</span>
        </div>
        <pre className="config-json" style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '0.76rem' }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      {/* Custom prompt */}
      {!generatedCode && (
        <div className="codegen-prompt-field">
          <label className="wizard-field-label" htmlFor="code-tab-user-prompt">
            Describe what you want your dApp to do (optional)
          </label>
          <textarea
            id="code-tab-user-prompt"
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
        <div className="api-key-input-wrap" style={{ marginBottom: '20px' }}>
          <label className="wizard-field-label" htmlFor="code-tab-api-key">
            Anthropic API key
          </label>
          <input
            id="code-tab-api-key"
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
          disabled={generating || !localKey.trim() || !selectedTemplate}
        >
          {generating ? (
            <>
              <Loader size={15} className="spin" />
              {loadingMsg}
            </>
          ) : !selectedTemplate ? (
            'Select a template first'
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
        <div className="wizard-gen-error" style={{ marginTop: '16px' }}>
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
        <div className="wizard-code-output" style={{ marginTop: '24px' }}>
          {/* Live iframe preview */}
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

          {/* Auto-save confirmation */}
          {savedConfirmation && (
            <div className="save-toast" style={{ marginTop: '12px' }}>
              ✓ Saved to My Library as <strong>{savedConfirmation}</strong>
            </div>
          )}

          {/* Code panel */}
          <div className="wizard-code-header" style={{ marginTop: '20px' }}>
            <span className="code-block-label">Generated HTML</span>
            <button className="wizard-copy-btn" onClick={handleCopy}>
              {copied ? (
                <><Check size={13} /> Copied ✓</>
              ) : (
                <><Copy size={13} /> Copy code</>
              )}
            </button>
          </div>
          <pre className="wizard-code-pre">{generatedCode}</pre>

          <button
            className="wizard-generate-btn"
            style={{ marginTop: '14px', background: 'rgba(38,184,255,0.06)' }}
            onClick={handleRegenerate}
          >
            <Sparkles size={14} />
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
