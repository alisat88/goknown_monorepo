import React from 'react';
import { GitBranch, RotateCcw, X } from 'lucide-react';
import { Template, WorkflowBlock } from '../types';
import { WORKFLOW_BLOCKS, API_COMPONENTS } from '../data';

interface Props {
  workflowSteps: WorkflowBlock[];
  onWorkflowChange: (steps: WorkflowBlock[]) => void;
  selectedTemplate: Template | null;
}

export function WorkflowBuilder({ workflowSteps, onWorkflowChange, selectedTemplate }: Props) {
  const addedIds = new Set(workflowSteps.map((s) => s.id));

  const addBlock = (block: WorkflowBlock) => {
    if (!addedIds.has(block.id)) {
      onWorkflowChange([...workflowSteps, block]);
    }
  };

  const removeStep = (index: number) => {
    onWorkflowChange(workflowSteps.filter((_, i) => i !== index));
  };

  const reset = () => onWorkflowChange([]);

  const apiLabel = (apiId?: string) => {
    if (!apiId) return '';
    const api = API_COMPONENTS.find((a) => a.id === apiId);
    return api ? api.endpoint : apiId;
  };

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Workflow Builder</p>
        <h2 className="pane-title">Compose your workflow</h2>
        <p className="pane-desc">
          Click blocks to add them to your workflow sequence. Blocks connect to the API components
          that back them. Remove any step with ✕ or reset the whole flow.
        </p>
      </div>

      {selectedTemplate && (
        <div className="workflow-template-note">
          Active template: <strong>{selectedTemplate.name}</strong> — API contracts for this
          template include: {selectedTemplate.apiIds.join(', ')}.
        </div>
      )}

      <div className="workflow-layout" style={{ marginTop: '20px' }}>
        {/* Left: Block palette */}
        <div className="workflow-panel">
          <h3 className="workflow-panel-title">
            <GitBranch size={15} />
            Available Blocks
          </h3>
          <div className="workflow-helper">
            Drag-and-drop workflow editor coming later. This MVP simulates workflow composition by
            selecting reusable blocks.
          </div>
          <div className="block-grid">
            {WORKFLOW_BLOCKS.map((block) => {
              const isAdded = addedIds.has(block.id);
              return (
                <button
                  key={block.id}
                  className="block-btn"
                  disabled={isAdded}
                  onClick={() => addBlock(block)}
                  title={isAdded ? 'Already in workflow' : `Add: ${block.label}`}
                >
                  <span className="block-dot" style={{ opacity: isAdded ? 0.25 : 0.7 }} />
                  {block.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Sequence */}
        <div className="workflow-panel">
          <h3 className="workflow-panel-title">
            Your Workflow
            {workflowSteps.length > 0 && (
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>
                {workflowSteps.length} step{workflowSteps.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>

          {workflowSteps.length === 0 ? (
            <div className="workflow-empty">
              Click a block on the left to begin building your workflow sequence.
            </div>
          ) : (
            <div className="workflow-sequence">
              {workflowSteps.map((step, i) => (
                <React.Fragment key={step.id}>
                  {i > 0 && <div className="workflow-arrow">↓</div>}
                  <div className="workflow-step">
                    <span className="workflow-step-num">{i + 1}</span>
                    <span className="workflow-step-label">{step.label}</span>
                    {step.apiId && (
                      <span className="workflow-step-api">{apiLabel(step.apiId)}</span>
                    )}
                    <button
                      className="workflow-step-remove"
                      onClick={() => removeStep(i)}
                      aria-label={`Remove ${step.label}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {workflowSteps.length > 0 && (
            <div className="workflow-actions">
              <button className="workflow-reset-btn" onClick={reset}>
                <RotateCcw size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Reset workflow
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
