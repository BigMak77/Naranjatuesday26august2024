/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/hr/people/edit/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import NeonPanel from '@/components/NeonPanel';
import NeonIconButton from '@/components/ui/NeonIconButton';
import { FiUserPlus } from "react-icons/fi";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();
  interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department_id: string;
    role_id: string;
    [key: string]: unknown;
  }
  interface Department { id: string; name: string; }
  interface Role { id: string; title: string; }

  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<User>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('users').select('*').eq('id', id).single(),
      supabase.from('departments').select('id, name'),
      supabase.from('roles').select('id, title'),
    ]).then(([userRes, deptRes, roleRes]) => {
      if (userRes.error || !userRes.data) {
        setError('User not found.');
        setLoading(false);
        return;
      }
      setUser(userRes.data);
      setForm(userRes.data);
      setDepartments((deptRes.data || []) as Department[]);
      setRoles((roleRes.data || []) as Role[]);
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('users').update(form).eq('id', id);
    setLoading(false);
    if (error) setError('Failed to update user.');
    else router.push('/hr/people');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <NeonPanel>
      <div className="neon-panel-actions" style={{ justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <NeonIconButton
          as="link"
          href="/hr/people/add"
          variant="add"
          icon={<FiUserPlus />}
          title="Add User"
        />
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <label className="neon-label">First Name</label>
            <input name="first_name" value={form.first_name || ''} onChange={handleChange} className="neon-input" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="neon-label">Last Name</label>
            <input name="last_name" value={form.last_name || ''} onChange={handleChange} className="neon-input" />
          </div>
        </div>
        <div>
          <label className="neon-label">Email</label>
          <input name="email" value={form.email || ''} onChange={handleChange} className="neon-input" />
        </div>
        <div>
          <label className="neon-label">Phone Number</label>
          <input name="phone" value={typeof form.phone === 'string' ? form.phone : ''} onChange={handleChange} className="neon-input" />
        </div>
        <div>
          <label className="neon-label">Department</label>
          <select
            name="department_id"
            value={form.department_id || ''}
            onChange={handleChange}
            className="neon-input"
            required
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="neon-label">Role</label>
          <select
            name="role_id"
            value={form.role_id || ''}
            onChange={handleChange}
            className="neon-input"
            required
          >
            <option value="">Select Role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
        <div className="neon-panel-actions">
          <NeonIconButton
            variant="back"
            title="Cancel"
            onClick={() => router.push('/hr/people')}
          />
          <NeonIconButton
            variant="edit"
            title="Save"
            type="submit"
          />
        </div>
      </form>
    </NeonPanel>
  );
}
