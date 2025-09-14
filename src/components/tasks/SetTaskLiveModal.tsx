import React, { useState } from "react";

interface SetTaskLiveModalProps {
  open: boolean;
  onClose: () => void;
  onSetLive: (liveAt: string) => void;
}

export default function SetTaskLiveModal({ open, onClose, onSetLive }: SetTaskLiveModalProps) {
  const [liveAt, setLiveAt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveAt) {
      setError("Please select a date and time.");
      return;
    }
    setError(null);
    onSetLive(liveAt);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="neon-modal-overlay">
      <div className="neon-modal" style={{ minWidth: 340, maxWidth: 420 }}>
        <form onSubmit={handleSubmit}>
          <h2 className="neon-form-title">Set Task Live Date</h2>
          <label htmlFor="liveAt">When should this task become live?</label>
          <input
            id="liveAt"
            type="datetime-local"
            className="neon-input"
            value={liveAt}
            onChange={e => setLiveAt(e.target.value)}
            required
            style={{ marginBottom: 16 }}
          />
          {error && <div className="neon-error">{error}</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" className="neon-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="neon-btn neon-btn-save">Set Live</button>
          </div>
        </form>
      </div>
    </div>
  );
}
