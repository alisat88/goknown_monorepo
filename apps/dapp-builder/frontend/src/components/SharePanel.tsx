import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { SavedDApp } from '../types';
import { shareApp, updateApp } from '../services/storage';
import { isWhitelisted } from '../services/whitelist';

interface Props {
  app: SavedDApp;
  onUpdated: (updated: SavedDApp) => void;
  onClose: () => void;
}

export function SharePanel({ app, onUpdated, onClose }: Props) {
  const [emailInput, setEmailInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleShare = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (app.sharedWith.map((e) => e.toLowerCase()).includes(email)) {
      setFeedback({ type: 'error', message: `${email} is already on the share list.` });
      return;
    }

    if (!isWhitelisted(email)) {
      setFeedback({
        type: 'error',
        message: 'This email is not on the approved access list. Contact your admin to add them.',
      });
      return;
    }

    shareApp(app.id, email);
    const updated: SavedDApp = {
      ...app,
      sharedWith: [...app.sharedWith, email],
      updatedAt: new Date().toISOString(),
    };
    onUpdated(updated);
    setEmailInput('');
    setFeedback({ type: 'success', message: `✓ Shared with ${email}` });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRemove = (email: string) => {
    // TODO (production): DELETE /api/dapps/:id/share/:email
    const newShared = app.sharedWith.filter((e) => e.toLowerCase() !== email.toLowerCase());
    updateApp(app.id, { sharedWith: newShared });
    const updated: SavedDApp = {
      ...app,
      sharedWith: newShared,
      updatedAt: new Date().toISOString(),
    };
    onUpdated(updated);
  };

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
          placeholder="Enter email address to share with"
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.84rem' }}
        />
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
          {app.sharedWith.map((email) => (
            <div key={email} className="share-email-row">
              <span className="share-email-address">{email}</span>
              <button
                className="share-remove-btn"
                onClick={() => handleRemove(email)}
                aria-label={`Remove ${email}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="share-panel-note">
        Sharing is managed by the dApp-level access control service in production.
      </p>
    </div>
  );
}
