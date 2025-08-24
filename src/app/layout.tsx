import "./globals.css";
import type { ReactNode } from "react";
import GlobalFooter from '@/components/GlobalFooter';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="global-content">{children}</div>
        </main>
        <GlobalFooter />
      </body>
    </html>
  );
}
