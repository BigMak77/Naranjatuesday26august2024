"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getDashboardUrl } from "@/lib/permissions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Fetch user profile to get access level
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      setError("Failed to get user information");
      setLoading(false);
      return;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("access_level")
      .eq("auth_id", authUser.id)
      .single();

    if (profileError || !userProfile) {
      setError("Failed to load user profile. Please contact an administrator.");
      setLoading(false);
      return;
    }

    // Redirect to appropriate dashboard based on access level
    const dashboardUrl = getDashboardUrl(userProfile.access_level);
    router.push(dashboardUrl);
    setLoading(false);
  };

  return (
    <div className="login-bg-wrapper">
      <div className="login-bg-image" aria-hidden="true" />
      <div className="login-bg-overlay" aria-hidden="true" />
      <div className="login-center-panel">
        <form onSubmit={handleLogin} className="login-form">
          <h1 className="login-title">NARANJA Login</h1>
          <p className="login-subtitle">Sign in to your account</p>
          <div>
            <label className="login-label">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="login-label">Password</label>
            <input
              type="password"
              required
              placeholder="********"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="neon-btn neon-btn-login neon-btn-square login-submit-btn"
            data-variant="login"
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-log-in neon-icon"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="3" y1="12" x2="15" y2="12"></line>
            </svg>
          </button>
          {error && <p className="login-error-msg">{error}</p>}
        </form>
      </div>
      <style jsx>{`
        .login-bg-wrapper {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          min-height: 100vh;
          z-index: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-bg-image {
          position: absolute;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: url('/background1.jpg') center center / cover no-repeat;
          z-index: 1;
        }
        .login-bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(4,8,9,0.82) 0%, rgba(31,118,125,0.82) 100%);
          z-index: 2;
        }
        .login-center-panel {
          position: relative;
          z-index: 3;
          min-width: 340px;
          max-width: 400px;
          width: 100%;
          margin: 0 auto;
          border-radius: 18px;
          box-shadow: 0 4px 32px 0 #000a, 0 0 0 2px var(--neon, #40e0d0);
          background: rgba(16, 32, 36, 0.82);
          backdrop-filter: blur(12px) saturate(1.2);
          padding: 2.5rem 2rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .login-title {
          text-align: center;
          font-size: 2rem;
          font-weight: 800;
          color: var(--accent, #fa7a20);
          margin-bottom: 0.5rem;
        }
        .login-subtitle {
          text-align: center;
          color: var(--neon, #40e0d0);
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }
        .login-label {
          color: var(--neon, #40e0d0);
          font-weight: 600;
          margin-bottom: .5rem;
          display: block;
        }
        .login-input {
          width: 100%;
          background: var(--field, #012b2b);
          color: var(--text, #fff);
          border: 1.5px solid var(--neon, #40e0d0);
          border-radius: var(--r-sm, 8px);
          padding: .75rem 1rem;
          font-size: 1rem;
        }
        .login-submit-btn {
          margin-top: 0.5rem;
        }
        .login-error-msg {
          color: #ff4d4f;
          font-weight: 600;
          text-align: center;
          margin-top: 1rem;
        }
        @media (max-width: 600px) {
          .login-center-panel {
            min-width: 0;
            max-width: 98vw;
            padding: 1.5rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
