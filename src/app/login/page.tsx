"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { getDashboardUrl } from "@/lib/permissions";
import OverlayDialog from "@/components/ui/OverlayDialog";

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
    <OverlayDialog
        open={true}
        onClose={() => {}}
        closeOnOutsideClick={false}
        width={450}
        ariaLabelledby="login-title"
        transparentOverlay={true}
        zIndexOverlay={10000}
        zIndexContent={10001}
      >
        <form onSubmit={handleLogin} className="login-form">
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/logo-turq-orange.png"
                alt="Logo Turq Orange"
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
              <h1 id="login-title" className="login-title">NARANJA Login</h1>
            </div>
          </div>
          <p className="login-subtitle">Log in to your account</p>

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
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <Link 
                href="/forgot-password" 
                style={{
                  color: '#40e0d0',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#5ff5e5';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#40e0d0';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: '700',
              color: '#ffffff',
              backgroundColor: '#fa7a20',
              border: '2px solid #fa7a20',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              opacity: loading ? 0.6 : 1,
              marginTop: '8px',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#ff8c3a';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fa7a20';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>

          {error && <p className="login-error-msg">{error}</p>}
        </form>

        <style jsx>{`
          .login-form {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            padding: 2rem;
          }
          .login-title {
            font-size: 2rem;
            font-weight: 800;
            color: #fa7a20;
            margin-bottom: 0.5rem;
            margin: 0;
          }
          .login-subtitle {
            text-align: center;
            color: #40e0d0;
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
          }
          .login-label {
            color: #40e0d0;
            font-weight: 600;
            margin-bottom: 0.5rem;
            display: block;
          }
          .login-input {
            width: 100%;
            background: #012b2b;
            color: #fff;
            border: 1.5px solid #40e0d0;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-size: 1rem;
          }
          .login-input:focus {
            outline: none;
            border-color: #fa7a20;
            box-shadow: 0 0 0 3px rgba(250, 122, 32, 0.1);
          }
          .login-error-msg {
            color: #ff4d4f;
            font-weight: 600;
            text-align: center;
            margin-top: 0;
          }
        `}</style>
      </OverlayDialog>
  );
}
