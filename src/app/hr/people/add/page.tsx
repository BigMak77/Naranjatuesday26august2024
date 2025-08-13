// src/app/hr/people/add/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import NeonForm from '@/components/NeonForm';
import NeonIconButton from '@/components/ui/NeonIconButton';

type Department = { id: string; name: string };
type Role = { id: string; title: string };

export default function AddUserPage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    role_id: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: dept, error: deptErr }, { data: role, error: roleErr }] = await Promise.all([
        supabase.from('departments').select('id, name').order('name', { ascending: true }),
        supabase.from('roles').select('id, title').order('title', { ascending: true }),
      ]);
      if (cancelled) return;

      if (deptErr || roleErr) {
        setError('Failed to load departments/roles.');
      } else {
        setDepartments((dept ?? []) as Department[]);
        setRoles((role ?? []) as Role[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) {
      const next = { ...fieldErrors };
      delete next[name];
      setFieldErrors(next);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Enter a valid email';
    if (!form.department_id) errs.department_id = 'Select a department';
    if (!form.role_id) errs.role_id = 'Select a role';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setError(null);
    if (!validate()) return;

    setSaving(true);

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() ? form.phone.trim() : null,
      department_id: form.department_id,
      role_id: form.role_id,
    };

    const { error: insertErr } = await supabase.from('users').insert([payload]);

    setSaving(false);

    if (insertErr) {
      // SupabaseError type with optional code and message
      type SupabaseError = { code?: string; message?: string };
      const code = (insertErr as SupabaseError).code;
      if (code === '23505') setError('That email is already in use.');
      else if (/policy|permission|not allowed|RLS|row level/i.test((insertErr as SupabaseError).message || ''))
        setError('You do not have permission to add users (RLS). Check Supabase policies.');
      else setError((insertErr as SupabaseError).message || 'Failed to add user.');
      return;
    }

    router.push('/hr/people');
  };

  if (loading) return <div>Loading…</div>;

  return (
    <NeonForm title="Add User" onSubmit={handleSubmit}>
      {/* Row 1 */}
      <div className="neon-form-row">
        <div className="neon-form-group">
          <label className="neon-label">First Name</label>
          <input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            className="neon-input"
            required
            aria-invalid={!!fieldErrors.first_name}
            aria-describedby="err-first_name"
          />
          {fieldErrors.first_name && (
            <div id="err-first_name" className="neon-error">{fieldErrors.first_name}</div>
          )}
        </div>
        <div className="neon-form-group">
          <label className="neon-label">Last Name</label>
          <input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            className="neon-input"
            required
            aria-invalid={!!fieldErrors.last_name}
            aria-describedby="err-last_name"
          />
          {fieldErrors.last_name && (
            <div id="err-last_name" className="neon-error">{fieldErrors.last_name}</div>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="neon-form-row">
        <div className="neon-form-group">
          <label className="neon-label">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="neon-input"
            required
            aria-invalid={!!fieldErrors.email}
            aria-describedby="err-email"
          />
          {fieldErrors.email && (
            <div id="err-email" className="neon-error">{fieldErrors.email}</div>
          )}
        </div>
        <div className="neon-form-group">
          <label className="neon-label">Phone Number</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="neon-input"
          />
        </div>
      </div>

      {/* Department */}
      <div className="neon-form-group">
        <label className="neon-label">Department</label>
        <select
          name="department_id"
          value={form.department_id}
          onChange={handleChange}
          className="neon-input"
          required
          aria-invalid={!!fieldErrors.department_id}
          aria-describedby="err-dept"
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {fieldErrors.department_id && (
          <div id="err-dept" className="neon-error">{fieldErrors.department_id}</div>
        )}
      </div>

      {/* Role */}
      <div className="neon-form-group">
        <label className="neon-label">Role</label>
        <select
          name="role_id"
          value={form.role_id}
          onChange={handleChange}
          className="neon-input"
          required
          aria-invalid={!!fieldErrors.role_id}
          aria-describedby="err-role"
        >
          <option value="">Select Role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
        {fieldErrors.role_id && (
          <div id="err-role" className="neon-error">{fieldErrors.role_id}</div>
        )}
      </div>

      {/* Global error */}
      {error && <div className="neon-error" style={{ marginTop: 12 }}>{error}</div>}

      {/* Actions */}
      <div className="neon-panel-actions">
        <NeonIconButton
          type="submit"
          variant="save"
          icon={<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>}
          title={saving ? 'Saving…' : 'Save'}
          disabled={saving}
        />
      </div>
    </NeonForm>
  );
}
