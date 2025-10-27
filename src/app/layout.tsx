import "./globals.css";
import type { ReactNode } from "react";
import AppWrapper from "@/components/layout/AppWrapper";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
