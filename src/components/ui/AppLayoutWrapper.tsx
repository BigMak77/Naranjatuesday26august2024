"use client";

import React from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import DynamicToolbar from "@/components/ui/DynamicToolbar";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
  // Toolbar customization
  forceToolbarType?: "admin" | "manager" | "hr" | "trainer" | "user" | "none";
  onViewChange?: (view: string) => void;
  onAddEmployee?: () => void;
  onManageTeam?: () => void;
  onViewReports?: () => void;
  // Layout customization
  showHeader?: boolean;
  showFooter?: boolean;
  showToolbar?: boolean;
}

/**
 * AppLayoutWrapper - A reusable layout component that includes:
 * - ProjectGlobalHeader
 * - DynamicToolbar (shows appropriate toolbar based on user role)
 * - Main content area
 * - Footer
 */
export default function AppLayoutWrapper({
  children,
  className = "",
  forceToolbarType,
  onViewChange,
  onAddEmployee,
  onManageTeam,
  onViewReports,
  showHeader = true,
  showFooter = true,
  showToolbar = true,
}: AppLayoutWrapperProps) {
  return (
    <>
      {showHeader && <ProjectGlobalHeader />}
      
      {showToolbar && (
        <DynamicToolbar
          className={className}
          forceToolbarType={forceToolbarType}
          onViewChange={onViewChange}
          onAddEmployee={onAddEmployee}
          onManageTeam={onManageTeam}
          onViewReports={onViewReports}
        />
      )}
      
      <main className="content">{children}</main>
      
      {showFooter && (
        <footer className="site-footer">
          <div className="inner">© Naranja</div>
        </footer>
      )}
    </>
  );
}
