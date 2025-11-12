
// app/homepage/layout.tsx  (SERVER component — no "use client")
import "../globals.css";
import type { ReactNode } from "react";
import GlobalFooter from "@/components/ui/GlobalFooter";

export default function HomepageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="content">{children}</main>
      <GlobalFooter />
    </>
  );
}
