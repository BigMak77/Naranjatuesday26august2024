import React, { useState } from "react";

interface RaiseNonConformanceModalProps {
  open: boolean;
  stepId: string;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

const RaiseNonConformanceModal: React.FC<RaiseNonConformanceModalProps> = ({ open, stepId, onSubmit, onClose }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for the failure.");
      return;
    }
    setError(null);
    onSubmit(reason.trim());
    setReason("");
  };

  return (
    <div className="neon-modal-overlay">
      <div className="neon-modal" style={{ minWidth: 380, maxWidth: 480 }}>
        <h3>Raise Non-Conformance</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="nc-reason">Reason for failure:</label>
          <textarea
            id="nc-reason"
            className="neon-input"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
            style={{ minHeight: 80, marginTop: 8, marginBottom: 8 }}
            placeholder="Describe why this step failed..."
          />
          {error && <div className="neon-error">{error}</div>}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="neon-btn" onClick={onClose} style={{ marginRight: 8 }}>Cancel</button>
            <button type="submit" className="neon-btn neon-btn-save">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseNonConformanceModal;
