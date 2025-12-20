"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UserProvider } from "@/context/UserContext";
import { ManagerProvider } from "@/context/ManagerContext";
import { GlobalSearchProvider } from "@/context/GlobalSearchContext";
import { TranslationProvider } from "@/context/TranslationContext";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import DynamicToolbar from "@/components/ui-toolbars/DynamicToolbar";
import GlobalSearchModal from "@/components/ui/GlobalSearchModal";
import AuthListener from "@/app/AuthListener";
import RaiseIssueModalProvider from "@/components/layout/RaiseIssueModalProvider";
import InactivityLogoutManager from "@/components/auth/InactivityLogoutManager";

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();

  // Homepage and login don't use app-shell wrapper but homepage still gets header
  const isHomepage = pathname === "/" || pathname?.startsWith("/homepage");
  const isLogin = pathname === "/login";
  const isLandingPage = pathname === "/landingpage";

  return (
    <TranslationProvider>
      <UserProvider>
        <ManagerProvider>
          <GlobalSearchProvider>
            <RaiseIssueModalProvider>
            <AuthListener />
            <GlobalSearchModal />
            <InactivityLogoutManager
              timeoutMinutes={30}
              warningSeconds={60}
              enabled={!isLogin}
            />
            {isHomepage ? (
              // Homepage: Header only, no app-shell wrapper, no toolbar (layout handles footer)
              <>
                <ProjectGlobalHeader />
                {children}
              </>
            ) : isLogin ? (
              // Login: No wrapper at all
              children
            ) : isLandingPage ? (
              // Landing Page: Full app-shell with header and toolbar, no footer
              <div className="app-shell">
                <ProjectGlobalHeader />
                <DynamicToolbar />
                <main className="content">{children}</main>
              </div>
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
          </GlobalSearchProvider>
        </ManagerProvider>
      </UserProvider>
    </TranslationProvider>
  );
}
