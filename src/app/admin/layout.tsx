// app/admin/layout.tsx
import type { ReactNode } from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import Sidebar from "@/components/Sidebar";
// import UserProvider from "@/components/UserProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ProjectGlobalHeader />
      <Sidebar />
      <main className="page">
        <div className="container">
          <section className="frame">{children}</section>
        </div>
      </main>
    </>
  );
}
