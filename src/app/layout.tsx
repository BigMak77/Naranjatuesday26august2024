import "./globals.css";
import type { ReactNode } from "react";
import GlobalHeader from "@/components/GlobalHeader";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="page">
        <header className="hero-header-neon">
          <GlobalHeader logoOnly />
        </header>
        <main className="after-hero">
          <div className="page-content">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
