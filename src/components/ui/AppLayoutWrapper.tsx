"use client";

import React from "react";
import ProjectGlobalHeader from "@/components/ui/ProjectGlobalHeader";
import DynamicToolbar from "@/components/ui-toolbars/DynamicToolbar";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
  // Toolbar customization
  forceToolbarType?: "super admin" | "admin" | "hr admin" | "h&s admin" | "dept. manager" | "manager" | "trainer" | "user" | "none";
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
