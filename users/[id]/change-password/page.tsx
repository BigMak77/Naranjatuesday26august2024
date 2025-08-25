"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { id } = useParams();
  const [authId, setAuthId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("auth_id")
        .eq("id", id)
        .single();

      if (error || !data?.auth_id) {
        setError("Could not load user or auth ID.");
      } else {
        setAuthId(data.auth_id);
      }

      setLoading(false);
    };

    fetchUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authId) return setError("Missing auth ID.");

    setSubmitting(true);

    const res = await fetch("/api/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_id: authId, new_password: password }),
    });

    const result = await res.json();

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin/users"), 1500);
    } else {
      setError(result.error || "Failed to update password");
    }

    setSubmitting(false);
  };

  if (loading) return <p className="change-password-loading-msg">Loading...</p>;
  if (error) return <p className="change-password-error-msg">{error}</p>;

  return (
    <main className="change-password-main">
      <form onSubmit={handleSubmit} className="change-password-form">
        <h1 className="change-password-title">
          <span
            className="change-password-title-icon"
            aria-label="Change Password"
            role="img"
          >
            🔒
          </span>{" "}
          Change Password
        </h1>

        {success && (
          <p className="change-password-success-msg" aria-live="polite">
            <span
              className="change-password-success-icon"
              aria-label="Success"
              role="img"
            >
              ✅
            </span>{" "}
            Password updated successfully!
          </p>
        )}

        <label className="change-password-label">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="change-password-input"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="change-password-submit-btn"
        >
          {submitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </main>
  );
}
