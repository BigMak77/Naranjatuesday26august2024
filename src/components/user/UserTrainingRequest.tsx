/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import NeonForm from '@/components/NeonForm';
import { supabase } from '@/lib/supabase-client';

interface UserTrainingRequestProps {
  userId: string;
}

interface ModuleOption {
  id: string;
  name: string;
}

export default function UserTrainingRequest({ userId }: UserTrainingRequestProps) {
  const [module, setModule] = useState('');
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      const { data, error } = await supabase
        .from('modules')
        .select('id, name')
        .order('name');
      if (!error && data) setModules(data);
      setLoadingModules(false);
    };
    fetchModules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.from('training_requests').insert([
      { user_id: userId, module, reason, other }
    ]);

    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setModule('');
      setReason('');
      setOther('');
    }
  };

  // Find the selected module's name for display in the search box (if needed)
  const selectedModule = modules.find(m => m.id === module);

  return (
    <NeonForm title="Request Training" onSubmit={handleSubmit} submitLabel={submitting ? 'Submitting...' : 'Submit Request'}>
      {/* Module Name */}
      <label className="neon-form-title">
        Module Name
        <select
          className="neon-input"
          value={module}
          onChange={e => setModule(e.target.value)}
          required
          disabled={loadingModules}
        >
          <option value="">Select a module...</option>
          {modules.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </label>
      {/* Reason */}
      <label className="neon-form-title">
        Reason
        <textarea
          className="neon-input"
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />
      </label>
      {/* Other Course/Training */}
      <label className="neon-form-title">
        Other Course/Training (if not listed above)
        <textarea
          className="neon-input"
          value={other}
          onChange={e => setOther(e.target.value)}
          placeholder="Describe any other course or training you wish to request..."
        />
      </label>
      {/* Feedback Messages */}
      {success && <div className="neon-success text-base">Request submitted!</div>}
      {error && <div className="neon-error text-base">{error}</div>}
    </NeonForm>
  );
}
