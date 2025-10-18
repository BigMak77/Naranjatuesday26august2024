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
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Info Message */}
        {departments.length === 0 && !loadingDepartments && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            <strong>No departments found.</strong> Create a department first before adding roles.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
              <p className="text-sm text-gray-500 mt-1">Loading departments...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g., Software Developer, Marketing Manager"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !roleName.trim() || !departmentId || departments.length === 0}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
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
