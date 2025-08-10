'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/context/UserContext';
import { FiClipboard } from 'react-icons/fi';
import NeonTable from '@/components/NeonTable';

export default function MyTasksWidget() {
  const { user, loading: userLoading } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.auth_id) return;

    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('task_assignments')
        .select('id, due_date, status, task:tasks(id, title, description)')
        .eq('assigned_to', user.auth_id)
        .order('due_date', { ascending: true });

      if (error) setError('Failed to load tasks.');
      setTasks(data || []);
      setLoading(false);
    };

    fetchTasks();
  }, [user]);

  if (userLoading) return <p className="text-neon">Loading user...</p>;
  if (!user) return null;

  return (
    <div className="bg-card p-6 rounded-xl shadow-glow border border-neon mb-8 text-neon">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 drop-shadow-glow">
        <FiClipboard /> My Tasks
      </h2>

      {loading ? (
        <p>Loading tasks...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-muted">No tasks assigned to you.</p>
      ) : (
        <div className="overflow-x-auto">
          <NeonTable
            columns={[
              { header: 'Task', accessor: 'task' },
              { header: 'Description', accessor: 'description' },
              { header: 'Due Date', accessor: 'due_date' },
              { header: 'Status', accessor: 'status' },
            ]}
            data={tasks.map((t) => ({
              task: t.task?.title || 'Untitled',
              description: t.task?.description || '—',
              due_date: t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : '—',
              status: t.status || 'Pending',
            }))}
          />
        </div>
      )}
    </div>
  );
}
