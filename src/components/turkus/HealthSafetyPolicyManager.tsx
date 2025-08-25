"use client";

import React, { useState, useEffect } from "react";
import { FiFileText, FiEdit, FiCheck } from "react-icons/fi";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

interface Policy {
  id: string;
  title: string;
  description: string;
}

export default function HealthSafetyPolicyManager() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchPolicies() {
      const { data, error } = await supabase
        .from("policies")
        .select("id, title, description");
      if (error) {
        setPolicies([]);
      } else {
        setPolicies(data || []);
      }
    }
    fetchPolicies();
  }, []);

  const handleEdit = (policy: Policy) => {
    setEditingId(policy.id);
    setForm({ title: policy.title, description: policy.description });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      if (editingId) {
        setPolicies((policies) =>
          policies.map((p) => (p.id === editingId ? { ...p, ...form } : p)),
        );
      } else {
        setPolicies((policies) => [
          ...policies,
          { id: String(Date.now()), ...form },
        ]);
      }
      setEditingId(null);
      setForm({ title: "", description: "" });
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    }, 800);
  };

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="global-content">
          <NeonPanel>
            <h2 className="neon-form-title">
              <FiFileText /> Health & Safety Policies
            </h2>
            <form
              onSubmit={handleSave}
              className="add-policy-form"
              style={{ marginBottom: "2rem" }}
            >
              <div className="add-policy-field">
                <label className="add-policy-label">Policy Title</label>
                <input
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleFormChange}
                  className="add-policy-input"
                  required
                />
              </div>
              <div className="add-policy-field">
                <label className="add-policy-label">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  className="add-policy-input"
                  rows={3}
                  required
                />
              </div>
              <div className="add-policy-actions">
                <NeonIconButton
                  variant="submit"
                  icon={<FiCheck />}
                  title={
                    saving
                      ? "Saving..."
                      : editingId
                        ? "Update Policy"
                        : "Add Policy"
                  }
                  type="submit"
                  disabled={saving}
                />
              </div>
              {success && (
                <p className="add-policy-success">
                  <FiCheck /> Policy saved!
                </p>
              )}
            </form>
            <ul className="neon-policy-list">
              {policies.length === 0 ? (
                <li className="neon-muted">No policies found.</li>
              ) : (
                policies.map((policy) => (
                  <li key={policy.id} className="neon-policy-item">
                    <Link
                      href={`/health-safety/policies/${policy.id}`}
                      className="neon-policy-link"
                    >
                      <strong>{policy.title}</strong>
                    </Link>
                    <div className="neon-policy-desc">{policy.description}</div>
                    <NeonIconButton
                      variant="edit"
                      icon={<FiEdit />}
                      title="Edit Policy"
                      onClick={() => handleEdit(policy)}
                      className="neon-policy-edit-btn"
                    />
                  </li>
                ))
              )}
            </ul>
          </NeonPanel>
        </main>
      </div>
    </div>
  );
}
