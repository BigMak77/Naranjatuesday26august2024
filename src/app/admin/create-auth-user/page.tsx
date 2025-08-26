"use client";

import { useState } from "react";
import NeonForm from "@/components/NeonForm";

export default function CreateAuthUserPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Creating user...");
    setLoading(true);

    const res = await fetch("/api/create-auth-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await res.json();

    if (res.ok) {
      setStatus(`✅ Created user: ${result.user.email}`);
      setEmail("");
      setPassword("");
    } else {
      setStatus(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 rounded shadow neon-panel">
      <h1 className="text-2xl font-bold mb-4">Create Auth User</h1>
      <NeonForm
        title="Create Auth User"
        submitLabel="Create User"
        onSubmit={handleSubmit}
      >
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
          className="neon-btn neon-btn-save w-full"
          data-variant="save"
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={{ marginRight: "0.5em" }}>Creating...</span>
            </>
          ) : (
            "Create User"
          )}
        </button>
        {status && <p className="mt-4 text-sm">{status}</p>}
      </NeonForm>
    </div>
  );
}
