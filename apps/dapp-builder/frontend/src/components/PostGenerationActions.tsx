import React, { useState } from 'react';
import { Sparkles, Loader, Save } from 'lucide-react';

interface Props {
  onApplyChanges: (prompt: string) => Promise<void>;
  onSave: () => void;
  onGoToLibrary?: () => void;
}

export function PostGenerationActions({ onApplyChanges, onSave, onGoToLibrary }: Props) {
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleApply = async () => {
    if (!followUpPrompt.trim() || editing) return;
    setEditing(true);
    setEditError(null);
    try {
      await onApplyChanges(followUpPrompt.trim());
      setFollowUpPrompt('');
      setConfirmed(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditing(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    onSave();
    setSaving(false);
    setConfirmed(true);
  };

  return (
    <div>
      <div className="codegen-followup">
        <label className="wizard-field-label" htmlFor="post-gen-followup">
          Make changes to your app
        </label>
        <textarea
          id="post-gen-followup"
          className="codegen-prompt-textarea"
          rows={3}
          value={followUpPrompt}
          onChange={(e) => setFollowUpPrompt(e.target.value)}
          placeholder="Describe any changes you want to make…"
          disabled={editing}
        />
        <button
          className="wizard-generate-btn"
          onClick={handleApply}
          disabled={editing || !followUpPrompt.trim()}
        >
          {editing ? (
            <><Loader size={15} className="spin" /> Applying changes…</>
          ) : (
            <><Sparkles size={14} /> Apply changes</>
          )}
        </button>
        {editError && (
          <div className="wizard-gen-error" style={{ marginTop: '12px' }}>
            <strong>Couldn't apply changes.</strong> {editError}
          </div>
        )}
      </div>

      <div className="codegen-save-section">
        {confirmed ? (
          <div className="save-confirmed-msg">
            <span>✓ App saved to your library.</span>
            {onGoToLibrary && (
              <button className="codegen-view-library-btn" onClick={onGoToLibrary}>
                View in library
              </button>
            )}
          </div>
        ) : (
          <button
            className="wizard-generate-btn codegen-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><Loader size={15} className="spin" /> Saving to library…</>
            ) : (
              <><Save size={14} /> No edits needed — save to library</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
