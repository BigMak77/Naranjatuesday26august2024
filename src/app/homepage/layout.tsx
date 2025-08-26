// app/admin/layout.tsx
import type { ReactNode } from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import ContentHeader from "@/components/headersandfooters/ContentHeader";
import { UserProvider } from "@/context/UserContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      {/* Sidebar removed */}
      <ProjectGlobalHeader />
      <ContentHeader title="Admin" />
      <main className="page">
        <div className="container">
          <section className="frame">{children}</section>
        </div>
      </main>
    </UserProvider>
  );
}
