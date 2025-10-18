"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiX, FiCheck, FiBriefcase } from "react-icons/fi";

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (department: { id: string; name: string }) => void;
}

export default function CreateDepartmentModal({
  isOpen,
  onClose,
  onSuccess
}: CreateDepartmentModalProps) {
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if department name already exists
      const { data: existing } = await supabase
        .from("departments")
        .select("id")
        .ilike("name", departmentName.trim())
        .single();

      if (existing) {
        setError("A department with this name already exists");
        setLoading(false);
        return;
      }

      // Create department
      const { data: newDepartment, error: createError } = await supabase
        .from("departments")
        .insert({
          name: departmentName.trim(),
          description: description.trim() || null
        })
        .select()
        .single();

      if (createError) throw createError;

      // Success
      onSuccess(newDepartment);
      setDepartmentName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create department");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setDepartmentName("");
      setDescription("");
      setError(null);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FiBriefcase className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create Department</h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="e.g., Engineering, Sales, Marketing"
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
              placeholder="Brief description of this department"
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
              disabled={loading || !departmentName.trim()}
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
                  Create Department
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
