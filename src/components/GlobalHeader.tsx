"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/lib/useUser";

type GlobalHeaderProps = {
  logoOnly?: boolean;
};

export default function GlobalHeader({ logoOnly = false }: GlobalHeaderProps) {
  const { user, loading } = useUser();

  if (logoOnly) {
    return (
      <div className="global-logo-header-rows" style={{ width: '100%' }}>
        <div className="global-logo-header" style={{ display: 'flex', alignItems: 'center', width: '100%', height: '80px', minHeight: '80px', maxHeight: '80px', boxSizing: 'border-box' }}>
          <Image
            src="/logo1.png"
            alt="Naranja logo"
            width={300}
            height={240}
            className="global-logo-img"
            style={{ width: '300px', height: '240px', objectFit: 'contain' }}
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className="global-logo-header-rows" style={{ position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }}>
      {/* Top row: logo and controls */}
      <div className="global-logo-header" style={{ display: 'flex', alignItems: 'center', width: '100%', height: '80px', minHeight: '80px', maxHeight: '80px', boxSizing: 'border-box' }}>
        <Image
          src="/logo1.png"
          alt="Naranja logo"
          width={300}
          height={240}
          className="global-logo-img"
          style={{ width: '300px', height: '240px', objectFit: 'contain' }}
          priority
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: '2rem', height: '80px' }}>
          {/* Only show login status and button, no UserProfileCard */}
          {!user?.auth_id && (
            <div className="user-profile-card user-profile-card-placeholder">Not logged in</div>
          )}
          {!loading && !user && (
            <Link
              href="/login"
              className="login-btn-orange"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', height: '40px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Log In
            </Link>
          )}
          {/* Add more header buttons/links here if needed, all will be in-line */}
        </div>
      </div>
      {/* Second row: add your content here */}
      <div className="global-header-second-row" style={{ width: '100%', minHeight: '40px', display: 'flex', alignItems: 'center', borderTop: '1px solid #eee', padding: '0 2rem' }}>
        {/* Example placeholder content for the second row */}
        <span style={{ color: '#888' }}>Second row content goes here</span>
      </div>
      {/* Footer removed */}
    </div>
  );
}
