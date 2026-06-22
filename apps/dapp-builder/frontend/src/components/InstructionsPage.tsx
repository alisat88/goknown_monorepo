import React from 'react';
import { Layers, GitBranch, Sparkles, Copy, Rocket } from 'lucide-react';
import { TabId } from '../types';
import { TEMPLATES } from '../data';

interface Props {
  onNavigate: (tab: TabId) => void;
}

const templateOneLiner: Record<string, string> = {
  'token-dashboard': 'Balance display, transfer form, and transaction history for fungible tokens.',
  'nft-mint': 'Mint button, metadata form, and collection preview for NFT issuance.',
  'dao-voting': 'Proposal cards, vote buttons, and quorum tracker for on-chain governance.',
  'escrow-payment': 'Sender/receiver fields, conditional release, and BFT-verified settlement.',
  'ledger-app': 'Immutable transaction table with BFT badges and filter/export controls.',
  'permissioned-workflow': 'Role-gated workflow steps, approval queue, and notification hooks.',
};

const flowSteps = [
  { icon: Layers, num: 1, label: 'Choose Template', desc: 'Pick a pre-built starting point for your dApp type.' },
  { icon: GitBranch, num: 2, label: 'Name Your dApp', desc: 'Give the project a name that will appear in the generated code.' },
  { icon: Layers, num: 3, label: 'Add Workflow Blocks', desc: 'Click blocks to compose the execution sequence (auth → permissions → logic).' },
  { icon: Sparkles, num: 4, label: 'Generate Code', desc: 'Hit "Generate Code" — the AI writes clean TypeScript/React for your dApp.' },
  { icon: Copy, num: 5, label: 'Copy & Deploy', desc: 'Copy the output and drop it into your project or repo.' },
];

export function InstructionsPage({ onNavigate }: Props) {
  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">How It Works</p>
        <h2 className="pane-title">Build a dApp in five steps</h2>
        <p className="pane-desc">
          DApp Builder turns a template + workflow blocks into production-ready TypeScript/React
          code. Pick a starting point, compose the execution logic, hit Generate — done.
        </p>
      </div>

      <div className="instructions-flow">
        {flowSteps.map((step, i, arr) => (
          <React.Fragment key={step.num}>
            <div className="instructions-step">
              <div className="instructions-step-num">{step.num}</div>
              <div className="instructions-step-icon">
                <step.icon size={20} />
              </div>
              <strong className="instructions-step-label">{step.label}</strong>
              <p className="instructions-step-desc">{step.desc}</p>
            </div>
            {i < arr.length - 1 && (
              <div className="instructions-flow-arrow">→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: '36px', marginBottom: '8px' }}>
        <p className="pane-kicker">Template types</p>
        <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', marginTop: '6px' }}>
          Six starting points, all composable
        </h3>
      </div>

      <div className="instructions-template-list">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="instructions-template-row">
            <div className="instructions-template-name">{t.name}</div>
            <div className="instructions-template-line">{templateOneLiner[t.id] ?? t.description}</div>
            <span className={`status-badge ${t.status === 'Mock template' ? 'status-badge--mock' : 'status-badge--soon'}`}>
              {t.status}
            </span>
          </div>
        ))}
      </div>

      <div className="instructions-api-note">
        <strong style={{ color: '#dff4ff' }}>Service layer:</strong> Generated code uses the
        Reusable API Component library as its service layer — each workflow block maps to a
        typed call to one of the eight microservice APIs (Identity, Wallet, Ledger, BFT,
        Permissions, Notifications, Workflow Orchestration, Smart Contract Adapter).{' '}
        <button
          className="instructions-link-btn"
          onClick={() => onNavigate('apis')}
        >
          Browse the API Components tab →
        </button>
      </div>

      <div style={{ marginTop: '32px' }}>
        <button className="enter-builder-btn" onClick={() => onNavigate('templates')}>
          <Rocket size={17} />
          Start Building →
        </button>
      </div>
    </div>
  );
}
