// app/manager/layout.tsx
import "../globals.css";
import type { ReactNode } from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import AuthListener from "@/app/AuthListener";
import ManagerLayoutWrapper from "@/components/manager/ManagerLayoutWrapper";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthListener />
      <ProjectGlobalHeader />
      <ManagerLayoutWrapper>{children}</ManagerLayoutWrapper>
      <footer className="site-footer">
        <div className="inner">© Naranja</div>
      </footer>
    </>
  );
}
