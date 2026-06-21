import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Template } from '../types';
import { TEMPLATES } from '../data';

interface Props {
  selectedTemplate: Template | null;
  onSelectTemplate: (t: Template) => void;
}

export function TemplateLibrary({ selectedTemplate, onSelectTemplate }: Props) {
  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Template Library</p>
        <h2 className="pane-title">Choose a starting point</h2>
        <p className="pane-desc">
          Select a template to pre-populate your workflow config, API mappings, and dApp preview.
          Templates are mock scaffolds — production builds will generate real code from your config.
        </p>
      </div>

      <div className="card-grid">
        {TEMPLATES.map((t) => {
          const isSelected = selectedTemplate?.id === t.id;
          return (
            <div
              key={t.id}
              className={`template-card${isSelected ? ' selected' : ''}`}
              onClick={() => t.status !== 'Coming soon' && onSelectTemplate(t)}
              role="button"
              aria-pressed={isSelected}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && t.status !== 'Coming soon' && onSelectTemplate(t)}
            >
              <div className="template-card-header">
                <h3 className="template-card-name">{t.name}</h3>
                <span className={`status-badge ${t.status === 'Mock template' ? 'status-badge--mock' : 'status-badge--soon'}`}>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
