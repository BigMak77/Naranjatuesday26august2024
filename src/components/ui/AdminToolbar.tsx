"use client";
import React, { useEffect, useState } from "react";

export default function AdminToolbar() {
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTraining(window.location.pathname.startsWith("/training"));
    }
  }, []);

  const handleSwitch = (checked: boolean) => {
    if (checked) window.location.href = "/training";
    else window.location.href = "/admin/dashboard";
  };

  return (
    <section className="section-toolbar neon-toolbar" style={{ zIndex: 20, position: 'relative' }}>
      <div className="inner" style={{ display: "flex", alignItems: "center", gap: 16, padding: "0.5rem 0", width: "100%", justifyContent: "flex-start" }}>
        <span className="neon-toolbar-title" style={{ fontWeight: 600, fontSize: "1.08rem", color: "var(--accent)", marginLeft: "1.5rem" }}>Admin Toolbar</span>
        <button className="neon-btn neon-btn-square" aria-label="Add">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus neon-icon"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button className="neon-btn neon-btn-square" aria-label="Refresh">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-refresh-cw neon-icon"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.36-3.36L23 10"/><path d="M20.49 15A9 9 0 0 1 6.13 18.36L1 14"/></svg>
        </button>
        <button className="neon-btn neon-btn-square" aria-label="My Training" onClick={() => window.location.href = '/user/dashboard'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-book neon-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20"/><path d="M20 22V2"/></svg>
        </button>
        {/* Slide switch between Admin and Training */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 24 }}>
          <span style={{ fontWeight: 500, color: !isTraining ? 'var(--accent)' : '#888' }}>Admin</span>
          <label className="neon-switch" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ display: 'none' }}
              onChange={e => handleSwitch(e.target.checked)}
              checked={isTraining}
            />
            <span className="neon-switch-slider" style={{ width: 40, height: 22, background: 'var(--neon-bg)', borderRadius: 12, position: 'relative', display: 'inline-block' }}>
              <span style={{ position: 'absolute', left: isTraining ? 22 : 2, top: 2, width: 18, height: 18, background: 'var(--accent)', borderRadius: '50%', transition: 'left 0.2s' }} />
            </span>
          </label>
          <span style={{ fontWeight: 500, color: isTraining ? 'var(--accent)' : '#888' }}>Training</span>
        </div>
      </div>
    </section>
  );
}
