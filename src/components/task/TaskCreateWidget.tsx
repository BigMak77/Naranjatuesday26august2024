'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/context/UserContext'; // Adjust path if needed
import { FiEdit } from 'react-icons/fi';
import NeonForm from '@/components/NeonForm';

export default function TaskCreateWidget() {
  const { user, loading: userLoading } = useUser();

  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!title || !area || !frequency || !user?.auth_id || !user?.department_id) {
      setError('Please complete all required fields.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('tasks').insert({
      title,
      area,
      frequency,
      instructions,
      created_by: user.auth_id,
      department_id: user.department_id, // 🔑 assign to user's department
    });

    if (error) setError('Failed to create task.');
    else setSuccess(true);

    setSaving(false);
    setTitle('');
    setArea('');
    setFrequency('');
    setInstructions('');
  };

  if (userLoading) return <p className="text-neon">Loading user...</p>;

  return (
    <div className="bg-card p-6 rounded-xl shadow-glow border border-neon mb-8 text-neon">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 drop-shadow-glow">
        <FiEdit /> Create Task
      </h2>
      <NeonForm title="Create Task" submitLabel={saving ? 'Creating...' : 'Create Task'} onSubmit={handleCreate}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-neon rounded bg-background px-3 py-2 text-neon shadow-glow"
          placeholder="Title"
          required
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full border border-neon rounded bg-background px-3 py-2 text-neon shadow-glow"
          placeholder="Area"
          required
        />
        <input
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full border border-neon rounded bg-background px-3 py-2 text-neon shadow-glow"
          placeholder="Frequency"
          required
        />
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full border border-neon rounded bg-background px-3 py-2 text-neon shadow-glow"
          placeholder="Instructions"
        />
        {error && <p className="text-red-400 mt-2">{error}</p>}
        {success && <p className="text-green-400 mt-2">Task created successfully!</p>}
      </NeonForm>
    </div>
  );
}
