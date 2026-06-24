import React, { useState } from 'react';
import { Monitor } from 'lucide-react';
import { Template } from '../types';
import { TEMPLATES } from '../data';

interface Props {
  selectedTemplate: Template | null;
}

const previewOptions = TEMPLATES.map((t) => ({ id: t.id, label: t.name }));

function TokenDashboard() {
  return (
    <>
      <div className="preview-row">
        <div className="preview-card">
          <div className="preview-card-label">ZTA Balance</div>
          <div className="preview-card-value">14,820.50</div>
        </div>
        <div className="preview-card">
          <div className="preview-card-label">USD Value</div>
          <div className="preview-card-value">$3,204.11</div>
        </div>
      </div>
      <div className="preview-card">
        <div className="preview-card-label">Transfer</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
          <input
            readOnly
            placeholder="Recipient address"
            style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: '9px', border: '1px solid rgba(78,229,255,0.18)', background: 'rgba(5,14,34,0.8)', color: '#c4daf5', fontSize: '0.86rem', fontFamily: 'inherit', outline: 'none' }}
          />
          <input
            readOnly
            placeholder="Amount"
            style={{ width: 90, padding: '8px 12px', borderRadius: '9px', border: '1px solid rgba(78,229,255,0.18)', background: 'rgba(5,14,34,0.8)', color: '#c4daf5', fontSize: '0.86rem', fontFamily: 'inherit', outline: 'none' }}
          />
          <span className="preview-placeholder-btn">Send →</span>
        </div>
      </div>
    </>
  );
}

function NftMintPage() {
  return (
    <>
      <div className="preview-row">
        {['#0042', '#0043', '#0044'].map((id) => (
          <div key={id} className="preview-card" style={{ textAlign: 'center' }}>
            <div style={{ width: '100%', height: '60px', borderRadius: '9px', background: 'linear-gradient(135deg, rgba(38,184,255,0.18), rgba(49,88,255,0.22))', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(78,229,255,0.5)', fontSize: '1.2rem' }}>◈</div>
            <div style={{ color: '#dff4ff', fontSize: '0.84rem', fontWeight: 600 }}>Collection {id}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <span className="preview-placeholder-btn">◈ Mint NFT (placeholder)</span>
        <span className="preview-placeholder-btn">Connect Wallet</span>
      </div>
    </>
  );
}

function DaoVotingPortal() {
  return (
    <>
      <div className="preview-proposal">
        <h4 className="preview-proposal-title">Proposal #14 — Increase quorum threshold to 67%</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
          This proposal adjusts the minimum quorum required for kBFT™ consensus on governance votes from 51% to 67% to improve security.
        </p>
        <div className="preview-vote-btns">
          <span className="preview-placeholder-btn" style={{ color: '#7ee87e' }}>✓ Vote For</span>
          <span className="preview-placeholder-btn" style={{ color: '#ff8855' }}>✗ Vote Against</span>
          <span className="preview-placeholder-btn">Abstain</span>
        </div>
      </div>
      <div className="preview-card">
        <div className="preview-card-label">Quorum status</div>
        <div style={{ display: 'flex', gap: '18px', marginTop: '8px', fontSize: '0.88rem' }}>
          <span style={{ color: '#7ee87e' }}>For: 58%</span>
          <span style={{ color: '#ff8855' }}>Against: 22%</span>
          <span style={{ color: 'var(--text-muted)' }}>Abstain: 20%</span>
        </div>
      </div>
    </>
  );
}

function EscrowPaymentApp() {
  return (
    <>
      <div className="preview-row">
        <div className="preview-card">
          <div className="preview-card-label">Sender</div>
          <div style={{ color: '#dff4ff', fontSize: '0.9rem', fontWeight: 600, marginTop: '6px' }}>Chuck (Demo)</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>0x4f3...2c1a</div>
        </div>
        <div className="preview-card">
          <div className="preview-card-label">Receiver</div>
          <div style={{ color: '#dff4ff', fontSize: '0.9rem', fontWeight: 600, marginTop: '6px' }}>Aviation Co.</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>0x9b1...7e4d</div>
        </div>
      </div>
      <div className="preview-card">
        <div className="preview-card-label">Payment status</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ color: '#ffc83c', fontSize: '0.88rem', fontWeight: 600 }}>⏳ Awaiting release condition</span>
          <span className="preview-placeholder-btn">Release funds →</span>
        </div>
      </div>
    </>
  );
}

function LedgerApp() {
  const entries = [
    { id: 'TX-0091', timestamp: '2026-06-21 14:32', action: 'VERIFY_FLIGHT', actor: 'System', hash: '0xa3f…c12' },
    { id: 'TX-0090', timestamp: '2026-06-21 14:28', action: 'SUBMIT_LOG', actor: 'Chuck', hash: '0xb7e…91d' },
    { id: 'TX-0089', timestamp: '2026-06-21 13:55', action: 'APPROVE_RECORD', actor: 'Connie', hash: '0xc2a…44f' },
    { id: 'TX-0088', timestamp: '2026-06-21 13:40', action: 'CREATE_ENTRY', actor: 'Mike', hash: '0xd9b…77c' },
  ];
  return (
    <table className="preview-table">
      <thead>
        <tr>
          <th>TX ID</th>
          <th>Timestamp</th>
          <th>Action</th>
          <th>Actor</th>
          <th>kBFT™ Hash</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.id}>
            <td style={{ fontFamily: 'monospace', color: '#4ee5ff', fontSize: '0.82rem' }}>{e.id}</td>
            <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{e.timestamp}</td>
            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.action}</td>
            <td>{e.actor}</td>
            <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{e.hash}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PermissionedWorkflow() {
  const steps = [
    { label: 'Submit request', role: 'Builder', status: 'done' },
    { label: 'Reviewer approval', role: 'Reviewer', status: 'pending' },
    { label: 'Owner sign-off', role: 'Owner', status: 'locked' },
    { label: 'Deploy to preview', role: 'Owner', status: 'locked' },
  ];
  const colorMap: Record<string, string> = { done: '#7ee87e', pending: '#ffc83c', locked: 'var(--text-muted)' };
  return (
    <div>
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: '12px', marginBottom: '8px', background: 'rgba(10,25,52,0.6)' }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(38,184,255,0.12)', border: '1px solid rgba(78,229,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)', fontSize: '0.76rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
          <span style={{ flex: 1, color: '#dff4ff', fontSize: '0.88rem' }}>{step.label}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Role: {step.role}</span>
          <span style={{ color: colorMap[step.status], fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{step.status}</span>
        </div>
      ))}
    </div>
  );
}

export const TEMPLATE_PREVIEW_TITLES: Record<string, string> = {
  'token-dashboard': 'Token Rewards Portal',
  'nft-mint': 'NFT Collection Launch',
  'dao-voting': 'DAO Voting Portal',
  'escrow-payment': 'Escrow Payment Flow',
  'ledger-app': 'Aviation Ledger App',
  'permissioned-workflow': 'Internal Workflow',
};

export function renderTemplateMockup(templateId: string): React.ReactNode {
  switch (templateId) {
    case 'token-dashboard':       return <TokenDashboard />;
    case 'nft-mint':              return <NftMintPage />;
    case 'dao-voting':            return <DaoVotingPortal />;
    case 'escrow-payment':        return <EscrowPaymentApp />;
    case 'ledger-app':            return <LedgerApp />;
    case 'permissioned-workflow': return <PermissionedWorkflow />;
    default: return (
      <div className="preview-empty">
        <Monitor size={36} className="preview-empty-icon" />
        <p>No template preview available. Generate code to see your dApp.</p>
      </div>
    );
  }
}

export function DAppPreview({ selectedTemplate }: Props) {
  const [activePreview, setActivePreview] = useState<string>(
    selectedTemplate?.id ?? 'token-dashboard'
  );

  const currentId = selectedTemplate?.id ?? activePreview;

  const title: Record<string, string> = {
    'token-dashboard': 'Token Rewards Portal',
    'nft-mint': 'NFT Collection Launch',
    'dao-voting': 'DAO Voting Portal',
    'escrow-payment': 'Escrow Payment Flow',
    'ledger-app': 'Aviation Ledger App',
    'permissioned-workflow': 'Internal Workflow',
  };

  function renderPreview(id: string) {
    switch (id) {
      case 'token-dashboard': return <TokenDashboard />;
      case 'nft-mint': return <NftMintPage />;
      case 'dao-voting': return <DaoVotingPortal />;
      case 'escrow-payment': return <EscrowPaymentApp />;
      case 'ledger-app': return <LedgerApp />;
      case 'permissioned-workflow': return <PermissionedWorkflow />;
      default: return (
        <div className="preview-empty">
          <Monitor size={36} className="preview-empty-icon" />
          <p>Select a template from the sidebar or the Templates tab to see a live dApp preview.</p>
        </div>
      );
    }
  }

  const displayId = selectedTemplate?.id ?? activePreview;

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Live dApp Preview</p>
        <h2 className="pane-title">Template preview</h2>
        <p className="pane-desc">
          See a mock UI for each template. The preview updates when you select a template or change
          it in the sidebar. All content is placeholder data — no real data or wallet is connected.
        </p>
      </div>

      <div className="preview-layout">
        {/* Sidebar selector */}
        <div className="preview-selector">
          <div className="preview-selector-title">Template</div>
          {previewOptions.map((opt) => (
            <button
              key={opt.id}
              className={`preview-option${displayId === opt.id ? ' active' : ''}`}
              onClick={() => setActivePreview(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Preview frame */}
        <div className="preview-frame">
          <div className="preview-frame-header">
            <h3 className="preview-frame-title">{title[displayId] ?? 'Select a template'}</h3>
            <span className="preview-badge">Mock preview</span>
          </div>
          {renderPreview(displayId)}
        </div>
      </div>
    </div>
  );
}
