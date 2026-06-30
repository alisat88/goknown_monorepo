import React from 'react';
import { PlayCircle } from 'lucide-react';

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

      <div className="tutorials-empty">
        <PlayCircle size={48} className="tutorials-empty-icon" />
        <p className="tutorials-empty-body">{DAPP_BUILDER_TUTORIALS_COPY.body}</p>
        <p className="tutorials-empty-sub">{DAPP_BUILDER_TUTORIALS_COPY.subtitle}</p>
      </div>
    </div>
  );
}
