import "../globals.css";
import type { ReactNode } from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import { UserProvider } from '@/context/UserContext';
import ContentHeader from "@/components/headersandfooters/ContentHeader";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      {/* ProjectGlobalHeader at the top */}
      <ProjectGlobalHeader />
      <ContentHeader />
      {/* Main content */}
      <main className="after-hero">
        <div className="global-content">
          <div className="page">
            {children}
          </div>
        </div>
      </main>
      {/* Footer removed */}
    </UserProvider>
  );
}
