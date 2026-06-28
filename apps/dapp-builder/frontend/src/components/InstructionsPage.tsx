import React from 'react';
import { Layers, GitBranch, Key, Eye, Rocket } from 'lucide-react';
import { TabId } from '../types';
import { TEMPLATES } from '../data';

interface Props {
  onNavigate: (tab: TabId) => void;
}

const templateOneLiner: Record<string, string> = {
  'token-dashboard': 'Balance display, transfer form, and transaction history for token apps.',
  'nft-mint': 'Mint button, metadata form, and collection preview for NFT issuance.',
  'dao-voting': 'Proposal cards, vote buttons, and quorum tracker for governance apps.',
  'escrow-payment': 'Sender/receiver fields, conditional release, and verified settlement.',
  'ledger-app': 'Immutable transaction table with filter and audit controls.',
  'permissioned-workflow': 'Role-gated workflow steps, approval queue, and notification hooks.',
  'custom': 'Blank canvas — describe exactly what you want and DApp Builder creates it.',
};

// Exported so tests can verify no developer-facing language is present.
export const FLOW_STEPS = [
  {
    icon: Layers,
    num: 1,
    label: 'Choose a template',
    desc: 'Pick a starting point from our template collection, or start from a blank canvas and describe exactly what you want.',
  },
  {
    icon: GitBranch,
    num: 2,
    label: 'Describe your app',
    desc: 'Give your app a name and describe what it should do in plain language. No coding knowledge required.',
  },
  {
    icon: GitBranch,
    num: 3,
    label: 'Build the workflow',
    desc: 'Select workflow blocks to define how your app runs — user login, data access, approvals, and more.',
  },
  {
    icon: Key,
    num: 4,
    label: 'Connect APIs',
    desc: 'Choose the services your app needs and configure any keys. DApp Builder handles the wiring for you.',
  },
  {
    icon: Eye,
    num: 5,
    label: 'Preview and create',
    desc: 'See your working app inside DApp Genius. When you\'re happy, save it to your library and share it with your team.',
  },
];

export function InstructionsPage({ onNavigate }: Props) {
  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">How It Works</p>
        <h2 className="pane-title">Build a working app in five steps</h2>
        <p className="pane-desc">
          DApp Builder creates a working app for you inside DApp Genius.
          Choose a template, describe what you want, build your workflow, connect APIs,
          preview the app, and save it to your library.
          You do not need to write code, use GitHub, or deploy anything manually.
        </p>
      </div>

      <div className="instructions-flow">
        {FLOW_STEPS.map((step, i, arr) => (
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
        <p className="pane-kicker">App templates</p>
        <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', marginTop: '6px' }}>
          Six starting points, all ready to launch
        </h3>
      </div>

      <div className="instructions-template-list">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="instructions-template-row">
            <div className="instructions-template-name">{t.name}</div>
            <div className="instructions-template-line">{templateOneLiner[t.id] ?? t.description}</div>
            <span className={`status-badge ${t.status === 'Mock template' ? 'status-badge--mock' : t.status === 'Custom' ? 'status-badge--custom' : 'status-badge--soon'}`}>
              {t.status}
            </span>
          </div>
        ))}
      </div>

      <div className="instructions-api-note">
        <strong style={{ color: '#dff4ff' }}>Powered by DApp Genius APIs:</strong> Each workflow
        block connects to a real DApp Genius service — Identity, Wallet, Ledger, Governance,
        Permissions, Notifications, and more.{' '}
        <button
          className="instructions-link-btn"
          onClick={() => onNavigate('apis')}
        >
          Browse available APIs →
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
