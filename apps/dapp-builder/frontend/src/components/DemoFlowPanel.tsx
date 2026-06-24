import React from 'react';
import { Play, CheckCircle, Eye } from 'lucide-react';
import { Template, WorkflowBlock, TabId, SavedDApp } from '../types';

interface Props {
  demoStarted: boolean;
  selectedTemplate: Template | null;
  workflowSteps: WorkflowBlock[];
  demoApp: SavedDApp | null;
  onStartDemo: () => void;
  onNavigateTab: (tab: TabId) => void;
  onViewDemo: () => void;
}

const demoSteps = [
  {
    title: 'Select template',
    desc: 'Aviation Ledger template pre-loaded for Chuck.',
    tab: 'templates' as TabId,
  },
  {
    title: 'Add workflow blocks',
    desc: 'Authenticate user → Check dApp permission → Read ledger entries.',
    tab: 'workflow' as TabId,
  },
  {
    title: 'Create dApp',
    desc: 'App object created and saved to library — preview available immediately.',
    tab: 'dashboard' as TabId,
  },
  {
    title: 'Generate code (optional)',
    desc: 'Use the Code Preview tab with your Anthropic API key to generate a live HTML app.',
    tab: 'code' as TabId,
  },
  {
    title: 'Share with team',
    desc: 'Open the app in the library and share it with a whitelisted collaborator.',
    tab: 'dashboard' as TabId,
  },
];

export function DemoFlowPanel({
  demoStarted,
  selectedTemplate,
  workflowSteps,
  demoApp,
  onStartDemo,
  onNavigateTab,
  onViewDemo,
}: Props) {
  const doneCount = demoStarted ? 3 : 0;

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Demo Flow</p>
        <h2 className="pane-title">Chuck's guided demo</h2>
        <p className="pane-desc">
          This panel walks through the complete DApp Builder experience. Click "Start Chuck Demo
          Flow" to automatically create a real dApp for Chuck — it will appear immediately in his
          library and open in preview.
        </p>
      </div>

      <div className="demo-panel">
        <div className="demo-panel-header">
          <div className="demo-panel-meta">
            <h3 className="demo-panel-title">
              {demoStarted
                ? `✓ "${demoApp?.dappName ?? 'Aviation Ledger App'}" created for Chuck`
                : 'Start the Aviation Ledger demo'}
            </h3>
            <p className="demo-panel-desc">
              {demoStarted
                ? `Template "${selectedTemplate?.name}" · ${workflowSteps.length} workflow step${workflowSteps.length !== 1 ? 's' : ''} · Status: Preview Ready. Continue with steps 4–5 below.`
                : 'Chuck is a Demo Builder. Click to create a real Aviation Ledger dApp for him, open it in preview, and continue from there.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {demoStarted && demoApp && (
              <button
                className="wizard-create-btn"
                onClick={onViewDemo}
                style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              >
                <Eye size={14} />
                View Preview
              </button>
            )}
            <button className="demo-start-btn" onClick={onStartDemo}>
              <Play size={15} />
              {demoStarted ? 'Restart demo' : 'Start Chuck Demo Flow'}
            </button>
          </div>
        </div>

        <div className="demo-steps">
          {demoSteps.map((step, i) => {
            const isDone = i < doneCount;
            const isNext = demoStarted && i === doneCount;
            return (
              <div key={step.title} className={`demo-step${isDone ? ' done' : ''}`}>
                <span className={`demo-step-num${isDone ? ' done' : ''}`}>
                  {isDone ? <CheckCircle size={14} /> : i + 1}
                </span>
                <h4 className="demo-step-title">{step.title}</h4>
                <p className="demo-step-desc">{step.desc}</p>
                {isNext && (
                  <button
                    onClick={() => onNavigateTab(step.tab)}
                    style={{
                      marginTop: '4px',
                      padding: '5px 11px',
                      border: '1px solid rgba(78,229,255,0.28)',
                      borderRadius: '8px',
                      background: 'rgba(38,184,255,0.08)',
                      color: '#4ee5ff',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    Go to {step.title} →
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {demoStarted && (
          <div className="demo-status">
            <strong>Steps 1–3 complete.</strong>{' '}
            {demoApp
              ? <>"{demoApp.dappName}" is in Chuck's library with status <strong>Preview Ready</strong>. Click <strong>View Preview</strong> above to open it, or continue to step 4 to generate code.</>
              : <>Template and workflow are pre-loaded. Navigate to My dApps to see the created app.</>
            }
          </div>
        )}
      </div>
    </div>
  );
}
