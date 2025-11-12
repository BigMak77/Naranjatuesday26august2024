"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <>
      <div className="login-bg-wrapper">
        <div className="login-bg-image" aria-hidden="true" />
        <div className="login-bg-overlay" aria-hidden="true" />
      </div>

      <OverlayDialog showCloseButton={true}
        open={true}
        onClose={() => {}}
        closeOnOutsideClick={false}
        width={450}
        ariaLabelledby="forgot-password-title"
      >
        {!success ? (
          <form onSubmit={handleResetPassword} className="login-form">
            <h1 id="forgot-password-title" className="login-title">Reset Password</h1>
            <p className="login-subtitle">Enter your email to receive a password reset link</p>

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

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 24px',
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
                boxShadow: '0 4px 16px rgba(250, 122, 32, 0.4)',
                opacity: loading ? 0.6 : 1,
                marginTop: '8px',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#ff8c3a';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 122, 32, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fa7a20';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(250, 122, 32, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            {error && <p className="login-error-msg">{error}</p>}

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link href="/login" className="back-to-login-link">
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div className="login-form">
            <h1 className="login-title">Check Your Email</h1>
            <p className="success-message">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="login-subtitle">
              Please check your email and follow the instructions to reset your password.
            </p>
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link href="/login" className="back-to-login-link">
                Back to Login
              </Link>
            </div>
          </div>
        )}

        <style jsx>{`
          .login-form {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            padding: 2rem;
          }
          .login-title {
            text-align: center;
            font-size: 2rem;
            font-weight: 800;
            color: #fa7a20;
            margin-bottom: 0.5rem;
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
          .success-message {
            color: #40e0d0;
            text-align: center;
            font-size: 1.1rem;
            margin: 1rem 0;
          }
          .success-message strong {
            color: #5ff5e5;
          }
          .back-to-login-link {
            color: #40e0d0;
            text-decoration: none;
            font-size: 1rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .back-to-login-link:hover {
            color: #5ff5e5;
            text-decoration: underline;
          }
          .login-bg-wrapper {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            min-height: 100vh;
            z-index: 0;
            overflow: hidden;
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
        `}</style>
      </OverlayDialog>
    </>
  );
}
