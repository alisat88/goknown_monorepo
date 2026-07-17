import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { SavedDApp, SharedRole } from '../types';
import { shareApp, removeShare } from '../services/storage';
import { getToken } from '../services/api';
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

// Basic format + self-share + duplicate guard (no whitelist in authenticated mode).
function validateShareBasic(app: SavedDApp, email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  if (app.ownerId?.toLowerCase() === trimmed) {
    return 'You already own this app.';
  }
  if (app.sharedWith.map((e) => e.toLowerCase()).includes(trimmed)) {
    return 'This user already has access.';
  }
  return null;
}

export function SharePanel({ app, onUpdated, onClose }: Props) {
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<SharedRole>('Viewer');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleShare = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    // Use full whitelist check in demo mode; basic checks only when authenticated.
    const isAuth = !!getToken();
    const validationError = isAuth
      ? validateShareBasic(app, email)
      : getShareValidationError(app, email);
    if (validationError) {
      setFeedback({ type: 'error', message: validationError });
      return;
    }

    try {
      const updated = await shareApp(app.id, email, { email, role: selectedRole });
      onUpdated(updated);
      setEmailInput('');
      setFeedback({ type: 'success', message: `✓ Shared with ${email} as ${selectedRole}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Share failed';
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleRemove = async (email: string) => {
    // In API mode, use the userId UUID so the backend can look up the access record.
    // In localStorage mode, userId is undefined so we fall back to the email string.
    const accessRecord = (app.sharedAccess ?? []).find(
      (a) => a.email === email.toLowerCase()
    );
    const userIdOrEmail = accessRecord?.userId ?? email.toLowerCase();

    try {
      const updated = await removeShare(app.id, userIdOrEmail);
      onUpdated(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Remove failed';
      setFeedback({ type: 'error', message: msg });
    }
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
