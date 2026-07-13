import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader, ExternalLink } from 'lucide-react';
import { Template, WorkflowBlock, SavedDApp } from '../types';
import { buildConfig } from '../lib/buildConfig';
import { generateDAppCode, generateEditedDAppCode, validateGeneratedHtml } from '../lib/generateCode';
import { saveApp, updateApp } from '../services/storage';
import { DEMO_USERS } from '../data';
import { PostGenerationActions } from './PostGenerationActions';

const LOADING_MESSAGES = [
  'Generating your dApp...',
  'Wiring up the workflow blocks...',
  'Connecting API services...',
  'Almost there...',
];

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.toLowerCase().includes('failed to fetch') ||
    msg.toLowerCase().includes('networkerror') ||
    msg.toLowerCase().includes('network error')
  ) {
    return 'Network error — check your connection and try again';
  }
  // Backend forwards Anthropic errors as "STATUS:detail"
  const statusMatch = msg.match(/^(\d{3}):(.*)/s);
  if (statusMatch) {
    const [, code, detail] = statusMatch;
    if (code === '429') return 'Rate limit reached — wait a moment and try again';
    return detail.trim() || `Server error (${code})`;
  }
  return msg;
}

interface Props {
  selectedTemplate: Template | null;
  workflowSteps: WorkflowBlock[];
  onSaveApp?: () => void;
  onGoToLibrary?: () => void;
  currentUserEmail?: string;
}

export function CodeGenerationPreview({
  selectedTemplate,
  workflowSteps,
  onSaveApp,
  onGoToLibrary,
  currentUserEmail,
}: Props) {
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [genError, setGenError] = useState<string | null>(null);
  const [savedAppId, setSavedAppId] = useState<string | null>(null);

  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, []);

  const config = buildConfig(selectedTemplate, workflowSteps);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    setGenError(null);
    setGeneratedCode(null);
    setLoadingMsg(LOADING_MESSAGES[0]);

    let msgIdx = 0;
    loadingIntervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2000);

    try {
      const html = await generateDAppCode({
        dappName: config.dappName,
        description: userPrompt.trim() || undefined,
        template: config.template,
        apis: config.apis,
        workflow: config.workflow,
        userPrompt,
      });

      const validationError = validateGeneratedHtml(html);
      if (validationError) {
        throw new Error(validationError);
      }

      setGeneratedCode(html);

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
      const ownerUser = DEMO_USERS.find((u) => u.email === currentUserEmail);

      let appId: string;
      if (existing) {
        appId = existing.id;
        updateApp(appId, { generatedCode: html, apis: config.apis, workflow: config.workflow, status: 'Generated' });
      } else {
        appId = `dapp_${crypto.randomUUID()}`;
        saveApp({
          id: appId,
          dappName: config.dappName,
          description: '',
          template: config.template,
          permissionModel: config.permissionModel,
          apis: config.apis,
          workflow: config.workflow,
          generatedCode: html,
          createdAt: now,
          updatedAt: now,
          sharedWith: [],
          sharedAccess: [],
          ownerId: currentUserEmail ?? '',
          ownerName: ownerUser?.name ?? '',
          status: 'Generated',
          version: 1,
        });
      }
      setSavedAppId(appId);
      onSaveApp?.();
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
    setSavedAppId(null);
  };

  const handleApplyChanges = async (prompt: string) => {
    if (!generatedCode) return;
    const updatedHtml = await generateEditedDAppCode(generatedCode, prompt, config.dappName);
    const validationError = validateGeneratedHtml(updatedHtml);
    if (validationError) throw new Error(validationError);
    setGeneratedCode(updatedHtml);
    if (savedAppId) updateApp(savedAppId, { generatedCode: updatedHtml });
  };

  const handleSaveToLibrary = () => {
    if (!generatedCode) return;
    if (savedAppId) updateApp(savedAppId, { generatedCode, status: 'Generated' });
    onSaveApp?.();
  };

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">App Generator</p>
        <h2 className="pane-title">Generate your app</h2>
        <p className="pane-desc">
          Select a template, build a workflow, and DApp Builder creates a working app for you —
          no code, no downloads, no deployment needed.
        </p>
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

      {/* Generate button */}
      {!generatedCode && (
        <button
          className="wizard-generate-btn"
          onClick={handleGenerate}
          disabled={generating || !selectedTemplate}
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
              Generate App
            </>
          )}
        </button>
      )}

      {/* Error */}
      {genError && (
        <div className="wizard-gen-error" style={{ marginTop: '16px' }}>
          <strong>We couldn't generate the app preview.</strong> {genError}
          <button
            style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#ff8855', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', textDecoration: 'underline' }}
            onClick={() => { setGenError(null); handleGenerate(); }}
          >
            Try again
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

          <PostGenerationActions
            onApplyChanges={handleApplyChanges}
            onSave={handleSaveToLibrary}
            onGoToLibrary={onGoToLibrary}
          />

          <button
            className="wizard-generate-btn codegen-regen-btn"
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
