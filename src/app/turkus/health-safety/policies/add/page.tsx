"use client";

import React, { useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiFileText, FiCheck, FiPlus } from "react-icons/fi";

export default function AddPolicyPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    // TODO: Add supabase upload logic here
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    }, 1000);
  };

  return (
    <NeonPanel className="add-policy-panel">
      <h1 className="add-policy-title">
        <FiFileText className="add-policy-title-icon" />
      </h1>
      <form onSubmit={handleSubmit} className="add-policy-form">
        <div className="add-policy-field">
          <label className="add-policy-label">Policy Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="add-policy-input"
            required
          />
        </div>
        <div className="add-policy-field">
          <label className="add-policy-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="add-policy-input"
            rows={3}
            required
          />
        </div>
        <div className="add-policy-field">
          <label className="add-policy-label">Upload File</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="add-policy-input"
            required
          />
        </div>
        {error && <p className="add-policy-error">{error}</p>}
        {success && (
          <p className="add-policy-success">
            <FiCheck /> Policy uploaded!
          </p>
        )}
        <div className="add-policy-actions">
          <NeonIconButton
            variant="add"
            icon={<FiPlus />}
            title="Add Policy"
          />
        </div>
      </form>
    </NeonPanel>
  );
}
