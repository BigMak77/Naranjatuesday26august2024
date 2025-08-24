// app/layout.tsx  (SERVER component — no "use client" here)
import "./globals.css"; // ✅ loads your neon + button styles globally
import type { ReactNode } from "react";
import AuthListener from "./AuthListener";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-[#011f24] text-white antialiased">
      <body className="min-h-screen flex flex-col bg-[#011f24] text-white">
        {/* Runs on the client, keeps your Supabase session in sync */}
        <AuthListener />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
