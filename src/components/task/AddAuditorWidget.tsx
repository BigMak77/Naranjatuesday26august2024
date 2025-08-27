// src/components/task/AddAuditorWidget.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiPlus } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function AddAuditorWidget({
  onAdded,
}: {
  onAdded?: () => void;
}) {
  const [authId, setAuthId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    firstName: string;
    lastName: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    if (!authId) {
      setUserInfo(null);
      return;
    }
    const fetchUserInfo = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, role(title)")
        .eq("auth_id", authId)
        .single();
      if (error || !data) {
        setUserInfo(null);
      } else {
        let roleTitle = "";
        const role = data.role;
        if (Array.isArray(role)) {
          roleTitle = role[0]?.title || "";
        } else if (role && typeof role === "object" && "title" in role) {
          roleTitle = (role as { title?: string })?.title || "";
        } else {
          roleTitle = "";
        }
        setUserInfo({
          firstName: data.first_name,
          lastName: data.last_name,
          role: roleTitle,
        });
      }
    };
    fetchUserInfo();
  }, [authId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);
    if (!authId) {
      setError("Please enter an Auth ID.");
      setLoading(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("auditor_list")
      .insert([{ auth_id: authId }]);
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
      setAuthId("");
      if (onAdded) onAdded();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="neon-panel"
      style={{ maxWidth: 400 }}
    >
      <h2 className="neon-section-title">Add User to Auditor List</h2>
      <input
        className="neon-input"
        placeholder="Auth ID"
        value={authId}
        onChange={(e) => setAuthId(e.target.value)}
        required
      />
      {userInfo && (
        <div className="neon-info" style={{ marginBottom: 8 }}>
          <strong>Name:</strong> {userInfo.firstName} {userInfo.lastName}
          <br />
          <strong>Role:</strong> {userInfo.role}
        </div>
      )}
      {error && <p className="neon-error">{error}</p>}
      {success && <p className="neon-success">User added to auditor list!</p>}
      <NeonIconButton variant="add" icon={<FiPlus />} title="Add Auditor" />
    </form>
  );
}
