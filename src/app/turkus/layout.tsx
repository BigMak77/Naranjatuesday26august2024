// app/turkus/layout.tsx  (SERVER component — no "use client")
import "../globals.css";
import type { ReactNode } from "react";

export default function TurkusLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
