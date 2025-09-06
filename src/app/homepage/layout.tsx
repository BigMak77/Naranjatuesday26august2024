// app/layout.tsx  (SERVER component — no "use client")
import "../globals.css";
import type { ReactNode } from "react";
import AuthListener from "@/app/AuthListener";
import HomepageHeader from "@/components/ui/HomepageHeader";
import Link from "next/link";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthListener />
      <HomepageHeader />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--gutter, 24px)' }}></div>
      <section className="section-toolbar">
        <div className="inner">{/* filters/actions */}</div>
      </section>
      <main className="content">
        <div style={{ margin: '0 0 18px 0', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--neon, #fa7a20)', fontWeight: 600, textDecoration: 'none', fontSize: '1rem' }}>
            ← Return to main page
          </Link>
        </div>
        {children}
      </main>
      <footer className="site-footer">
        <div className="inner">© Naranja</div>
      </footer>
    </>
  );
}
