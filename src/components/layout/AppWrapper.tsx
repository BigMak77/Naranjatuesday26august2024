"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UserProvider } from "@/context/UserContext";
import { ManagerProvider } from "@/context/ManagerContext";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import DynamicToolbar from "@/components/ui/DynamicToolbar";
import AuthListener from "@/app/AuthListener";
import RaiseIssueModalProvider from "@/components/layout/RaiseIssueModalProvider";

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();

  // Homepage and login don't use app-shell wrapper but homepage still gets header
  const isHomepage = pathname === "/";
  const isLogin = pathname === "/login";

  return (
    <UserProvider>
      <ManagerProvider>
        <RaiseIssueModalProvider>
          <AuthListener />
          {isHomepage ? (
            // Homepage: Header only, no app-shell wrapper, no toolbar, no footer (page.tsx handles its own footer)
            <>
              <ProjectGlobalHeader />
              {children}
            </>
          ) : isLogin ? (
            // Login: No wrapper at all
            children
          ) : (
            // All other pages: Full app-shell with header, toolbar, and footer
            <div className="app-shell">
              <ProjectGlobalHeader />
              <DynamicToolbar />
              <main className="content">{children}</main>
              <footer className="site-footer">
                <div className="inner">© Naranja</div>
              </footer>
            </div>
          )}
        </RaiseIssueModalProvider>
      </ManagerProvider>
    </UserProvider>
  );
}
