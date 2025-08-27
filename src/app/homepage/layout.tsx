// app/layout.tsx  (SERVER component — no "use client")
import "../globals.css";
import type { ReactNode } from "react";
import AuthListener from "@/app/AuthListener";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthListener />
      <section className="section-toolbar">
        <div className="inner">{/* filters/actions */}</div>
      </section>
      <main className="content">{children}</main>
      <footer className="site-footer">
        <div className="inner">© Naranja</div>
      </footer>
    </>
  );
}
