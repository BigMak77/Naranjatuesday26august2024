import "../globals.css";
import type { ReactNode } from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import ContentHeader from "@/components/headersandfooters/ContentHeader";
import { UserProvider } from "@/context/UserContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      {/* Full-bleed header bands */}
      <ProjectGlobalHeader />
      <ContentHeader title="Manager" />

      {/* Framed main applied globally */}
      <main className="page">
        <div className="container">
          <section className="frame">{children}</section>
        </div>
      </main>

      {/* Footer can go here later as a full-bleed band */}
    </UserProvider>
  );
}
