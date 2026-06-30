import React from 'react';
import { PlayCircle } from 'lucide-react';
import { DAPP_BUILDER_TUTORIALS } from '../dappBuilderTutorials';
import { PromptGuide } from './PromptGuide';

// Exported so tests can verify copy without rendering the component.
export const DAPP_BUILDER_TUTORIALS_COPY = {
  title: 'DApp Builder Tutorials',
  body: 'DApp Builder tutorial videos will appear here soon.',
  subtitle:
    'Future tutorials will cover choosing templates, building workflows, connecting APIs, previewing apps, saving drafts, and sharing apps.',
} as const;

export function TutorialsPage() {
  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Resources</p>
        <h2 className="pane-title">{DAPP_BUILDER_TUTORIALS_COPY.title}</h2>
        <p className="pane-desc">
          Step-by-step walkthroughs for every stage of the DApp Builder workflow.
        </p>
      </div>

      <div className="tutorials-section">
        <p className="tutorials-section-label">Tutorial Videos</p>
        {DAPP_BUILDER_TUTORIALS.length > 0 ? (
          <div className="tutorial-list">
            {DAPP_BUILDER_TUTORIALS.map((tutorial) => (
              <div key={tutorial.id} className="tutorial-card">
                <div className="tutorial-card-icon">
                  <PlayCircle size={24} />
                </div>
                <div className="tutorial-card-content">
                  <p className="tutorial-card-title">{tutorial.title}</p>
                  <p className="tutorial-card-desc">{tutorial.description}</p>
                </div>
                <a
                  href={tutorial.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tutorial-watch-btn"
                >
                  Watch Tutorial
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="tutorials-empty">
            <PlayCircle size={48} className="tutorials-empty-icon" />
            <p className="tutorials-empty-body">{DAPP_BUILDER_TUTORIALS_COPY.body}</p>
            <p className="tutorials-empty-sub">{DAPP_BUILDER_TUTORIALS_COPY.subtitle}</p>
          </div>
        )}
      </div>

      <div className="tutorials-section tutorials-section--spaced">
        <p className="tutorials-section-label">Prompt Writing Guide</p>
        <PromptGuide />
      </div>
    </div>
  );
}
