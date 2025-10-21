"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import AdminToolbar from "./AdminToolbar";
import ManagerToolbar from "./ManagerToolbar";
import ListButton from "./ListButton";

interface DynamicToolbarProps {
  className?: string;
  onViewChange?: (view: string) => void;
  // Manager-specific props
  onAddEmployee?: () => void;
  onManageTeam?: () => void;
  onViewReports?: () => void;
  // Override to force a specific toolbar type
  forceToolbarType?: "admin" | "manager" | "hr" | "trainer" | "user" | "none";
}

/**
 * DynamicToolbar - Shows the appropriate toolbar based on user's access level
 * - Admin users see AdminToolbar
 * - Manager users see ManagerToolbar
 * - HR users see basic HR toolbar
 * - Other users see a basic toolbar or no toolbar
 */
export default function DynamicToolbar({
  className = "",
  onViewChange,
  onAddEmployee,
  onManageTeam,
  onViewReports,
  forceToolbarType,
}: DynamicToolbarProps) {
  const { user, loading } = useUser();

  // Show loading state
  if (loading) {
    return (
      <section className={`section-toolbar ${className}`.trim()}>
        <span>Loading...</span>
      </section>
    );
  }

  // No user logged in
  if (!user) {
    return null;
  }

  // Use forced toolbar type if provided, otherwise use user's access level
  const toolbarType = forceToolbarType || user.access_level?.toLowerCase();

  // Show appropriate toolbar based on access level
  switch (toolbarType) {
    case "admin":
    case "super admin":
      return <AdminToolbar />;
      
    case "manager":
      return (
        <ManagerToolbar
          className={className}
        />
      );
      
    case "hr":
    case "hr admin":
      // HR Toolbar with basic HR functionality
      return (
        <section className={`section-toolbar ${className}`.trim()}>
          <span>HR Toolbar</span>
          <ListButton 
            onViewChange={onViewChange || (() => {})}
            aria-label="Select HR view"
          />
        </section>
      );
      
    case "trainer":
      // Trainer Toolbar with training-specific functionality
      return (
        <section className={`section-toolbar ${className}`.trim()}>
          <span>Trainer Toolbar</span>
          <ListButton 
            onViewChange={onViewChange || (() => {})}
            aria-label="Select trainer view"
          />
        </section>
      );
      
    case "h&s admin":
    case "health & safety admin":
      // Health & Safety Admin Toolbar
      return (
        <section className={`section-toolbar ${className}`.trim()}>
          <span>H&S Admin Toolbar</span>
          <ListButton 
            onViewChange={onViewChange || (() => {})}
            aria-label="Select H&S view"
          />
        </section>
      );
      
    case "user":
      // Basic toolbar for regular users
      return (
        <section className={`section-toolbar ${className}`.trim()}>
          <span>User Toolbar</span>
          <ListButton 
            onViewChange={onViewChange || (() => {})}
            aria-label="Select user view"
          />
        </section>
      );
      
    case "none":
      // No toolbar
      return null;
      
    default:
      // Default basic toolbar for unknown access levels
      return (
        <section className={`section-toolbar ${className}`.trim()}>
          <span>Toolbar</span>
          <ListButton 
            onViewChange={onViewChange || (() => {})}
            aria-label="Select view"
          />
        </section>
      );
  }
}
