// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import AppWrapper from "@/components/layout/AppWrapper";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },               // fallback for older browsers & Windows
      { url: "/favicon.svg?v=3", type: "image/svg+xml" },      // preferred modern format
      { url: "/favicon-96x96.png?v=3", sizes: "96x96", type: "image/png" }, // extra resolution fallback
    ],
    apple: "/apple-touch-icon.png?v=4",                        // iOS home screen icon
  },
  manifest: "/site.webmanifest?v=4",                           // PWA manifest
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
