import React from 'react';
import { Template, WorkflowBlock } from '../types';
import { buildConfig } from '../lib/buildConfig';

interface Props {
  selectedTemplate: Template | null;
  workflowSteps: WorkflowBlock[];
}

function JsonLine({ line }: { line: string }) {
  const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)/);
  if (keyMatch) {
    const [, indent, key, colon, rest] = keyMatch;
    const isString = rest.startsWith('"') && (rest.endsWith('"') || rest.endsWith('",'));
    const isArray = rest === '[' || rest === '[],';
    return (
      <span>
        {indent}
        <span style={{ color: '#79dcff' }}>"{key}"</span>
        {colon}
        {isString ? <span style={{ color: '#b5f1c8' }}>{rest}</span> : rest}
        {isArray ? rest : ''}
      </span>
    );
  }
  if (line.trim().startsWith('"') && !line.includes(':')) {
    return <span style={{ color: '#b5f1c8' }}>{line}</span>;
  }
  return <span style={{ color: 'rgba(200,220,255,0.55)' }}>{line}</span>;
}

export function GeneratedConfigPanel({ selectedTemplate, workflowSteps }: Props) {
  const config = buildConfig(selectedTemplate, workflowSteps);
  const json = JSON.stringify(config, null, 2);
  const lines = json.split('\n');

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Generated Config</p>
        <h2 className="pane-title">Workflow configuration preview</h2>
        <p className="pane-desc">
          This JSON config is derived live from your selected template and workflow steps. In
          production, this config drives code generation, API wiring, and deployment scaffolding.
        </p>
      </div>

      <div className="config-layout">
        {/* Left: live JSON */}
        <div className="config-panel">
          <div className="config-panel-header">
            <h3 className="config-panel-label">dapp.config.json</h3>
            <span className="config-live-badge">Live</span>
          </div>
          <pre className="config-json">
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                <JsonLine line={line} />
                {i < lines.length - 1 && '\n'}
              </React.Fragment>
            ))}
          </pre>
        </div>

        {/* Right: summary */}
        <div className="config-summary">
          <h3 className="config-summary-title">Config summary</h3>

          {!selectedTemplate && workflowSteps.length === 0 ? (
            <p className="config-empty">
              Select a template and add workflow blocks to generate a config.
            </p>
          ) : (
            <>
              <div className="config-row">
                <span className="config-row-key">dApp name</span>
                <span className="config-row-val">{config.dappName}</span>
              </div>
              <div className="config-row">
                <span className="config-row-key">Template</span>
                <span className="config-row-val">{selectedTemplate?.name ?? '—'}</span>
              </div>
              <div className="config-row">
                <span className="config-row-key">Permission model</span>
                <span className="config-row-val" style={{ textTransform: 'capitalize' }}>
                  {config.permissionModel}
                </span>
              </div>
              <div className="config-row" style={{ flexDirection: 'column', gap: '8px' }}>
                <span className="config-row-key">APIs ({config.apis.length})</span>
                {config.apis.length === 0 ? (
                  <span className="config-row-val" style={{ textAlign: 'left' }}>—</span>
                ) : (
                  <ul className="config-steps-list">
                    {config.apis.map((a) => (
                      <li key={a}>
                        <span className="config-step-dot" />
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="config-row" style={{ flexDirection: 'column', gap: '8px' }}>
                <span className="config-row-key">
                  Workflow steps ({workflowSteps.length})
                </span>
                {workflowSteps.length === 0 ? (
                  <span className="config-row-val" style={{ textAlign: 'left', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    No steps added yet
                  </span>
                ) : (
                  <ul className="config-steps-list">
                    {workflowSteps.map((s, i) => (
                      <li key={s.id}>
                        <span className="config-step-dot" style={{ background: 'var(--blue)' }} />
                        <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontSize: '0.76rem' }}>
                          {i + 1}.
                        </span>
                        {s.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
