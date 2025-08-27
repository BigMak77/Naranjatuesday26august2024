// app/layout.tsx  (SERVER component — no "use client")
import "../globals.css";
import type { ReactNode } from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import AuthListener from "@/app/AuthListener";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthListener />
      <ProjectGlobalHeader />
      <section className="section-toolbar neon-toolbar" style={{ zIndex: 20, position: 'relative' }}>
        <div className="inner" style={{ display: "flex", alignItems: "center", gap: 16, padding: "0.5rem 0", width: "100%", justifyContent: "flex-start" }}>
          <span className="neon-toolbar-title" style={{ fontWeight: 600, fontSize: "1.08rem", color: "var(--accent)", marginLeft: "1.5rem" }}>Admin Toolbar</span>
          <button className="neon-btn neon-btn-square" aria-label="Add">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus neon-icon"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button className="neon-btn neon-btn-square" aria-label="Refresh">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-refresh-cw neon-icon"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.36-3.36L23 10"/><path d="M20.49 15A9 9 0 0 1 6.13 18.36L1 14"/></svg>
          </button>
        </div>
      </section>
      <main className="content">{children}</main>
      <footer className="site-footer">
        <div className="inner">© Naranja</div>
      </footer>
    </>
  );
}
