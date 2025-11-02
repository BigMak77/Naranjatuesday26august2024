"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiX, FiCheck, FiShield } from "react-icons/fi";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: { id: string; title: string; department_id: string }) => void;
  preSelectedDepartmentId?: string;
}

interface Department {
  id: string;
  name: string;
}

export default function CreateRoleModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedDepartmentId
}: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState(preSelectedDepartmentId || "");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load departments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      if (preSelectedDepartmentId) {
        setDepartmentId(preSelectedDepartmentId);
      }
    }
  }, [isOpen, preSelectedDepartmentId]);

  async function fetchDepartments() {
    setLoadingDepartments(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (err: any) {
      console.error("Error fetching departments:", err);
      setError("Failed to load departments");
    } finally {
      setLoadingDepartments(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if role name already exists in this department
      const { data: existing } = await supabase
        .from("roles")
        .select("id")
        .eq("department_id", departmentId)
        .ilike("title", roleName.trim())
        .single();

      if (existing) {
        setError("A role with this name already exists in this department");
        setLoading(false);
        return;
      }

      // Create role
      const { data: newRole, error: createError } = await supabase
        .from("roles")
        .insert({
          title: roleName.trim(),
          description: description.trim() || null,
          department_id: departmentId
        })
        .select()
        .single();

      if (createError) throw createError;

      // Success
      onSuccess(newRole);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setRoleName("");
    setDescription("");
    setDepartmentId(preSelectedDepartmentId || "");
    setError(null);
  }

  function handleClose() {
    if (!loading) {
      resetForm();
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FiShield className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create Role</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="neon-panel" style={{
            marginBottom: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--text-error)',
            color: 'var(--text-error)',
            padding: '0.75rem 1rem',
            fontSize: 'var(--font-size-base)'
          }}>
            {error}
          </div>
        )}

        {/* Info Message */}
        {departments.length === 0 && !loadingDepartments && (
          <div className="neon-panel" style={{
            marginBottom: '1rem',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid #eab308',
            color: '#eab308',
            padding: '0.75rem 1rem',
            fontSize: 'var(--font-size-base)'
          }}>
            <strong>No departments found.</strong> Create a department first before adding roles.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="neon-form-label">
              Department <span style={{ color: 'var(--text-error)' }}>*</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="neon-input"
              required
              disabled={loading || loadingDepartments}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {loadingDepartments && (
              <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-white)', opacity: 0.7, marginTop: '0.25rem' }}>Loading departments...</p>
            )}
          </div>

          <div>
            <label className="neon-form-label">
              Role Name <span style={{ color: 'var(--text-error)' }}>*</span>
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g., Software Developer, Marketing Manager"
              className="neon-input"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="neon-form-label">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role"
              rows={3}
              style={{
                width: '100%',
                background: 'var(--field)',
                color: 'var(--text-white)',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.75rem 1rem'
              }}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="neon-btn-cancel transition-colors"
              style={{ flex: 1, opacity: loading ? 0.5 : 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !roleName.trim() || !departmentId || departments.length === 0}
              className="neon-btn-primary transition-colors"
              style={{ 
                flex: 1, 
                opacity: (loading || !roleName.trim() || !departmentId || departments.length === 0) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating...
                </>
              ) : (
                <>
                  <FiCheck style={{ width: '16px', height: '16px' }} />
                  Create Role
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
