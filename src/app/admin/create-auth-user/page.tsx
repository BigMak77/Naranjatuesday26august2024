"use client";

import { useState } from "react";
import NeonForm from "@/components/NeonForm";
import { supabase } from "@/lib/supabase-client";

export default function CreateAuthUserPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Creating user...");
    setLoading(true);

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setStatus("❌ Error: Not authenticated. Please log in as admin.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/create-auth-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await res.json();

    if (res.ok) {
      setStatus(`✅ Created user: ${result.user.email}`);
      setEmail("");
      setPassword("");
    } else {
      setStatus(`❌ Error: ${result.error || result.message}`);
    }
    setLoading(false);
  };

  return (
    <main className="neon-bg">
      <section className="neon-panel neon-panel-centered">
        <h1 className="neon-title">Create Auth User</h1>
        <NeonForm title="Create Auth User" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="neon-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="neon-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="neon-btn neon-btn-primary neon-btn-square"
            data-variant="save"
            disabled={loading}
            aria-label="Create User"
          >
            {/* Feather user-plus icon, icon-only action */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user-plus neon-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </button>
          {status && <p className="neon-status neon-description">{status}</p>}
        </NeonForm>
      </section>
    </main>
  );
}
