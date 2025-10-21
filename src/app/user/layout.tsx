// app/layout.tsx  (SERVER component — no "use client")
import "../globals.css";
import type { ReactNode } from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import AuthListener from "@/app/AuthListener";
import UserToolbar from "@/components/ui/UserToolbar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthListener />
      <ProjectGlobalHeader />
      <UserToolbar />
      <main className="content">{children}</main>
      <footer className="site-footer">
        <div className="inner">© Naranja</div>
      </footer>
    </>
  );
}
