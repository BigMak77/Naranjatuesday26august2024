// app/admin/layout.tsx
import type { ReactNode } from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import ContentHeader from "@/components/headersandfooters/ContentHeader";
import { UserProvider } from "@/context/UserContext";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      {/* This renders inside admin tree, but Sidebar should be under the global header */}
      
      <Sidebar />
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
