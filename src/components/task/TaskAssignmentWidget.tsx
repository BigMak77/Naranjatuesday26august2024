'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/context/UserContext'; // Adjust this to your actual context
import { FiUserPlus } from 'react-icons/fi';
import NeonForm from '@/components/NeonForm';
import NeonIconButton from '@/components/ui/NeonIconButton';

export default function TaskAssignmentWidget() {
  const { user, loading: userLoading } = useUser();
  type Task = {
    id: string;
    title: string;
    department_id: string;
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  type User = {
    auth_id: string;
    first_name: string;
    last_name: string;
  };
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user?.department_id) return;

    const fetchData = async () => {
      // Fetch only tasks assigned to the user's department
      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, title, department_id')
        .eq('department_id', user.department_id);

      setTasks(taskData || []);

      const { data: userData } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name')
        .eq('department_id', user.department_id); // Removed .neq('auth_id', user.auth_id)

      setUsers(userData || []);
    };

    fetchData();
  }, [user]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!selectedTask || !selectedUser || !dueDate || !user?.auth_id) {
      setError('Please select all fields.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('task_assignments').insert({
      task_id: selectedTask,
      assigned_to: selectedUser,
      assigned_by: user.auth_id,
      due_date: dueDate,
    });

    if (error) setError('Failed to assign task.');
    else setSuccess(true);
    setLoading(false);
  };

  if (userLoading) return <p className="neon-info">Loading user...</p>;

  return (
    <div>
      <h2 className="neon-section-title">
        <FiUserPlus /> Assign Task
      </h2>
      <NeonForm title="Assign Task" onSubmit={handleAssign}>
        <select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="neon-input"
        >
          <option value="">Select Task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="neon-input"
        >
          <option value="">Select User</option>
          {users.map((u) => (
            <option key={u.auth_id} value={u.auth_id}>
              {u.first_name} {u.last_name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="neon-input"
        />
        <div className="neon-panel-actions">
          <NeonIconButton
            type="submit"
            variant="add"
            icon={<FiUserPlus />}
            title={loading ? 'Assigning...' : 'Assign Task'}
            disabled={loading}
          />
        </div>
        {error && <p className="neon-error">{error}</p>}
        {success && <p className="neon-success">Task assigned successfully!</p>}
      </NeonForm>
    </div>
  );
}
