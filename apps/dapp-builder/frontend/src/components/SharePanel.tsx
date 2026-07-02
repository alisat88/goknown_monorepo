import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { SavedDApp, SharedRole, SharedAccess } from '../types';
import { shareApp, updateApp } from '../services/storage';
import { getShareValidationError } from '../services/whitelist';

interface Props {
  app: SavedDApp;
  onUpdated: (updated: SavedDApp) => void;
  onClose: () => void;
}

const ROLES: SharedRole[] = ['Viewer', 'Builder', 'Reviewer'];

const ROLE_DESC: Record<SharedRole, string> = {
  Viewer:   'Can open preview only',
  Builder:  'Can preview and edit workflow',
  Reviewer: 'Can preview and review config',
};

export function SharePanel({ app, onUpdated, onClose }: Props) {
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<SharedRole>('Viewer');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleShare = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    const validationError = getShareValidationError(app, email);
    if (validationError) {
      setFeedback({ type: 'error', message: validationError });
      return;
    }

    const access: SharedAccess = { email, role: selectedRole };
    shareApp(app.id, email, access);
    const newSharedAccess = [
      ...(app.sharedAccess ?? []).filter((a) => a.email !== email),
      access,
    ];
    const updated: SavedDApp = {
      ...app,
      sharedWith: [...app.sharedWith, email],
      sharedAccess: newSharedAccess,
      updatedAt: new Date().toISOString(),
    };
    onUpdated(updated);
    setEmailInput('');
    setFeedback({ type: 'success', message: `✓ Shared with ${email} as ${selectedRole}` });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRemove = (email: string) => {
    // TODO (production): DELETE /api/dapps/:id/share/:email
    const newShared = app.sharedWith.filter((e) => e.toLowerCase() !== email.toLowerCase());
    const newAccess = (app.sharedAccess ?? []).filter((a) => a.email !== email.toLowerCase());
    updateApp(app.id, { sharedWith: newShared, sharedAccess: newAccess });
    const updated: SavedDApp = {
      ...app,
      sharedWith: newShared,
      sharedAccess: newAccess,
      updatedAt: new Date().toISOString(),
    };
    onUpdated(updated);
  };

  const getRoleForEmail = (email: string): SharedRole | null =>
    (app.sharedAccess ?? []).find((a) => a.email === email.toLowerCase())?.role ?? null;

  return (
    <div className="share-panel">
      <div className="share-panel-header">
        <strong>Share "{app.dappName}"</strong>
        <button className="share-panel-close" onClick={onClose} aria-label="Close share panel">
          <X size={14} />
        </button>
      </div>

      <div className="share-input-row">
        <input
          className="wizard-input"
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleShare()}
          placeholder="Enter a DAppGenius user email"
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.84rem' }}
        />
        <select
          className="share-role-select"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as SharedRole)}
          aria-label="Permission role"
        >
          {ROLES.map((r) => (
            <option key={r} value={r} title={ROLE_DESC[r]}>{r}</option>
          ))}
        </select>
        <button className="share-send-btn" onClick={handleShare} aria-label="Share">
          <Send size={14} />
          Share
        </button>
      </div>

      {feedback && (
        <div className={`share-feedback share-feedback--${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {app.sharedWith.length > 0 && (
        <div className="share-email-list">
          <div className="share-email-list-label">Shared with</div>
          {app.sharedWith.map((email) => {
            const role = getRoleForEmail(email);
            return (
              <div key={email} className="share-email-row">
                <span className="share-email-address">{email}</span>
                {role && (
                  <span className={`shared-role-badge shared-role-badge--${role.toLowerCase()}`}>
                    {role}
                  </span>
                )}
                <button
                  className="share-remove-btn"
                  onClick={() => handleRemove(email)}
                  aria-label={`Remove ${email}`}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="share-panel-note">
        Only valid DAppGenius users can be granted access.
        Sharing is enforced by the access control service in production.
      </p>
    </div>
  );
}
