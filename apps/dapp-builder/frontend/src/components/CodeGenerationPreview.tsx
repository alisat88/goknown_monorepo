import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Loader } from 'lucide-react';
import { Template, WorkflowBlock } from '../types';
import { buildConfig } from '../lib/buildConfig';
import { generateDAppCode } from '../lib/generateCode';

interface Props {
  selectedTemplate: Template | null;
  workflowSteps: WorkflowBlock[];
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function CodeGenerationPreview({
  selectedTemplate,
  workflowSteps,
  apiKey,
  onApiKeyChange,
}: Props) {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);

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
    try {
      const code = await generateDAppCode(selectedTemplate, workflowSteps, config.dappName, key);
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

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">AI-Assisted Code Generation</p>
        <h2 className="pane-title">Generate dApp code</h2>
        <p className="pane-desc">
          Select a template, build a workflow, then generate production-ready TypeScript/React
          from your config. Provide an Anthropic API key to activate generation — or use the
          Create dApp wizard from the Templates tab for a guided flow.
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
              Generating…
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

      {/* Generated code */}
      {generatedCode && (
        <div className="wizard-code-output" style={{ marginTop: '24px' }}>
          <div className="wizard-code-header">
            <span className="code-block-label">Generated TypeScript / React</span>
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
            onClick={() => { setGeneratedCode(null); setGenError(null); }}
          >
            <Sparkles size={14} />
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
