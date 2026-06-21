import React from 'react';
import { Play, CheckCircle, ArrowRight } from 'lucide-react';
import { Template, WorkflowBlock, TabId } from '../types';

interface Props {
  demoStarted: boolean;
  selectedTemplate: Template | null;
  workflowSteps: WorkflowBlock[];
  onStartDemo: () => void;
  onNavigateTab: (tab: TabId) => void;
}

const demoSteps = [
  {
    title: 'Choose a template',
    desc: 'Select the Aviation Ledger App template from the Template Library.',
    tab: 'templates' as TabId,
  },
  {
    title: 'Add workflow blocks',
    desc: 'Compose: Authenticate user → Check dApp permission → Read ledger entries.',
    tab: 'workflow' as TabId,
  },
  {
    title: 'Review generated config',
    desc: 'Inspect the auto-generated dapp.config.json with APIs and workflow steps.',
    tab: 'config' as TabId,
  },
  {
    title: 'Preview the dApp',
    desc: 'See the live mock UI for the Aviation Ledger template.',
    tab: 'preview' as TabId,
  },
  {
    title: 'Request permission review',
    desc: 'Submit the workflow for Reviewer approval before deploying to preview.',
    tab: 'permissions' as TabId,
  },
];

export function DemoFlowPanel({
  demoStarted,
  selectedTemplate,
  workflowSteps,
  onStartDemo,
  onNavigateTab,
}: Props) {
  const doneCount = demoStarted ? 3 : 0;

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Demo Flow</p>
        <h2 className="pane-title">Chuck's guided demo</h2>
        <p className="pane-desc">
          This panel walks through the complete DApp Builder experience from a Viewer / Demo Builder
          perspective. Click "Start Chuck Demo Flow" to automatically preselect the Aviation Ledger
          template and seed the workflow, then follow the remaining steps.
        </p>
      </div>

      <div className="demo-panel">
        <div className="demo-panel-header">
          <div className="demo-panel-meta">
            <h3 className="demo-panel-title">
              {demoStarted ? '✓ Demo flow active — continue below' : 'Start the Aviation Ledger demo'}
            </h3>
            <p className="demo-panel-desc">
              {demoStarted
                ? `Template "${selectedTemplate?.name}" selected. Workflow seeded with ${workflowSteps.length} step${workflowSteps.length !== 1 ? 's' : ''}. Steps 4 and 5 are yours to complete.`
                : 'Chuck is a Demo Builder with Viewer access. Click to preload the ledger template and the first three workflow steps automatically.'}
            </p>
          </div>
          <button className="demo-start-btn" onClick={onStartDemo}>
            <Play size={15} />
            {demoStarted ? 'Restart demo' : 'Start Chuck Demo Flow'}
          </button>
        </div>

        <div className="demo-steps">
          {demoSteps.map((step, i) => {
            const isDone = i < doneCount;
            return (
              <div key={step.title} className={`demo-step${isDone ? ' done' : ''}`}>
                <span className={`demo-step-num${isDone ? ' done' : ''}`}>
                  {isDone ? <CheckCircle size={14} /> : i + 1}
                </span>
                <h4 className="demo-step-title">{step.title}</h4>
                <p className="demo-step-desc">{step.desc}</p>
                {!isDone && demoStarted && (
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    Go <ArrowRight size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {demoStarted && (
          <div className="demo-status">
            <strong>Steps 1–3 complete.</strong> Template and workflow are pre-loaded.
            Navigate to <strong>dApp Preview</strong> (step 4) to see the Aviation Ledger mock UI,
            then to <strong>Permissions</strong> (step 5) to request a reviewer sign-off before
            the dApp can move to Preview status.
          </div>
        )}
      </div>
    </div>
  );
}
