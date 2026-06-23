import React from 'react';
import { CheckCircle, Plus } from 'lucide-react';
import { Template, TemplateStatus } from '../types';
import { TEMPLATES } from '../data';

interface Props {
  selectedTemplate: Template | null;
  onSelectTemplate: (t: Template) => void;
  onUseTemplate?: (t: Template) => void;
}

function badgeClass(status: TemplateStatus): string {
  if (status === 'Custom') return 'status-badge--custom';
  if (status === 'Coming soon') return 'status-badge--soon';
  return 'status-badge--mock';
}

export function TemplateLibrary({ selectedTemplate, onSelectTemplate, onUseTemplate }: Props) {
  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Template Library</p>
        <h2 className="pane-title">Choose a starting point</h2>
        <p className="pane-desc">
          Select a template to pre-populate your workflow config, API mappings, and dApp preview.
          Click "Use this template" to launch the step-by-step wizard and generate code.
        </p>
      </div>

      <div className="card-grid">
        {TEMPLATES.map((t) => {
          const isSelected = selectedTemplate?.id === t.id;
          const isAvailable = t.status !== 'Coming soon';
          const isScratch = t.id === 'custom';
          return (
            <div
              key={t.id}
              className={`template-card${isSelected ? ' selected' : ''}${isScratch ? ' template-card--scratch' : ''}`}
              onClick={() => isAvailable && onSelectTemplate(t)}
              role="button"
              aria-pressed={isSelected}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && isAvailable && onSelectTemplate(t)}
            >
              <div className="template-card-header">
                <h3 className="template-card-name">
                  {isScratch && (
                    <span className="scratch-plus-icon">
                      <Plus size={14} />
                    </span>
                  )}
                  {t.name}
                </h3>
                <span className={`status-badge ${badgeClass(t.status)}`}>
                  {t.status}
                </span>
              </div>

              <p className="template-card-desc">{t.description}</p>

              <div className="template-use-case">
                <div className="template-use-case-label">Suggested use case</div>
                <div className="template-use-case-value">{t.suggestedUseCase}</div>
              </div>

              <div className="template-use-case">
                <div className="template-use-case-label">Permission model</div>
                <div className="template-use-case-value" style={{ textTransform: 'capitalize' }}>{t.permissionModel}</div>
              </div>

              <div className="template-components">
                {t.includedComponents.map((c) => (
                  <span key={c} className="component-chip">{c}</span>
                ))}
              </div>

              {isSelected && (
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '7px', color: '#4ee5ff', fontSize: '0.84rem', fontWeight: 600 }}>
                  <CheckCircle size={15} />
                  Selected
                </div>
              )}

              {onUseTemplate && isAvailable && (
                <button
                  className={`use-template-btn${isScratch ? ' use-template-btn--scratch' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onUseTemplate(t); }}
                >
                  {isScratch ? '+ Start from scratch →' : 'Use this template →'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
