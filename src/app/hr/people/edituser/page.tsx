"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { FiX, FiSave } from "react-icons/fi";

export default function EditUserPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase.from("departments").select("id, name"),
      supabase.from("roles").select("id, title"),
    ]).then(([userRes, deptRes, roleRes]) => {
      if (userRes.error) setError("Failed to load user.");
      setUser(userRes.data);
      setForm({
        ...(userRes.data || {}),
        is_first_aider: !!userRes.data?.is_first_aider,
      });
      setDepartments(deptRes.data || []);
      setRoles(roleRes.data || []);
      setLoading(false);
    });
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("users").update(form).eq("id", userId);
    setSaving(false);
    if (error) setError("Failed to save user.");
    else router.push("/hr/people");
  };

  if (!userId) return <div className="neon-error">No user ID provided.</div>;
  if (loading) return <div>Loading user...</div>;
  if (error) return <div className="neon-error">{error}</div>;
  if (!user) return <div>User not found.</div>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="neon-panel max-w-lg w-full">
        <h1 className="neon-form-title mb-6">Edit User</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="flex flex-col gap-4"
        >
          <label>
            First Name
            <input
              className="neon-input w-full"
              name="first_name"
              value={form.first_name || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Last Name
            <input
              className="neon-input w-full"
              name="last_name"
              value={form.last_name || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email
            <input
              className="neon-input w-full"
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Department
            <select
              className="neon-input w-full"
              name="department_id"
              value={form.department_id || ""}
              onChange={handleChange}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Role
            <select
              className="neon-input w-full"
              name="role_id"
              value={form.role_id || ""}
              onChange={handleChange}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_first_aider"
              checked={!!form.is_first_aider}
              onChange={handleChange}
            />
            Is this user a first aider?
          </label>

          {/* Actions: square neon buttons */}
          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={() => router.push("/hr/people")}
              className="neon-btn-square neon-btn-cancel"
              title="Cancel"
              aria-label="Cancel"
            >
              <FiX />
            </button>

            <button
              type="submit"
              disabled={saving}
              className="neon-btn-square neon-btn-save"
              title="Save"
              aria-label="Save"
            >
              <FiSave />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
