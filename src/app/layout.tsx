import "./globals.css";
import type { ReactNode } from "react";
// Removed GlobalHeader import

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Removed header and GlobalHeader */}
        <main className="after-hero">
          <div className="global-content">{children}</div>
        </main>
        {/* Footer removed as requested */}
      </body>
    </html>
  );
}
