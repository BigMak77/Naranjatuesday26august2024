import React, { useState } from 'react';
import NeonPanel from '@/components/NeonPanel';
import NeonIconButton from '@/components/ui/NeonIconButton';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';

export default function AddIncidentPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [reporter, setReporter] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    // TODO: Add supabase insert logic here
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    }, 1000);
  };

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="page-main">
          <NeonPanel className="add-incident-panel">
            <h1 className="add-incident-title">
              <FiAlertCircle className="add-incident-title-icon" />
            </h1>
            <form onSubmit={handleSubmit} className="add-incident-form">
              <div className="add-incident-field">
                <label className="add-incident-label">Incident Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="add-incident-input" required />
              </div>
              <div className="add-incident-field">
                <label className="add-incident-label">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="add-incident-input" rows={3} required />
              </div>
              <div className="add-incident-field">
                <label className="add-incident-label">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="add-incident-input" required />
              </div>
              <div className="add-incident-field">
                <label className="add-incident-label">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="add-incident-input" required />
              </div>
              <div className="add-incident-field">
                <label className="add-incident-label">Reporter Name</label>
                <input type="text" value={reporter} onChange={e => setReporter(e.target.value)} className="add-incident-input" required />
              </div>
              {error && <p className="add-incident-error">{error}</p>}
              {success && <p className="add-incident-success"><FiCheck /> Incident recorded!</p>}
              <div className="add-incident-actions">
                <NeonIconButton
                  variant="submit"
                  icon={<FiCheck />}
                  title={saving ? 'Saving...' : 'Record Incident'}
                  type="submit"
                  disabled={saving}
                />
              </div>
            </form>
          </NeonPanel>
        </main>
      </div>
    </div>
  );
}
