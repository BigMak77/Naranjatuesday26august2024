"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { ManagerProvider } from "@/context/ManagerContext";
import SuperAdminToolbar from "./SuperAdminToolbar";
import AdminToolbar from "./AdminToolbar";
import HRAdminToolbar from "./HRAdminToolbar";
import HSAdminToolbar from "./HSAdminToolbar";
import ManagerToolbar from "./ManagerToolbar";
import TrainerToolbar from "./TrainerToolbar";
import UserToolbar from "./UserToolbar";

interface DynamicToolbarProps {
  className?: string;
  // Override to force a specific toolbar type
  forceToolbarType?: "super admin" | "admin" | "hr admin" | "h&s admin" | "dept. manager" | "manager" | "trainer" | "user" | "none";
}

/**
 * DynamicToolbar - Shows the appropriate toolbar based on user's access level
 *
 * Displays role-specific toolbars:
 * - Super Admin: Full system access with all sections
 * - Admin: System administration and management
 * - HR Admin: Employee management across all departments
 * - H&S Admin: Health & Safety management across all departments
 * - Dept. Manager: Department-wide management (all shifts in their department)
 * - Manager: Shift-level management (only their shift in their department)
 * - Trainer: Training management across assigned departments
 * - User: Basic user toolbar with personal information
 */
export default function DynamicToolbar({
  className = "",
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
  const toolbarType = (forceToolbarType || user.access_level)?.toLowerCase();

  // Show appropriate toolbar based on access level
  switch (toolbarType) {
    case "super admin":
      return <SuperAdminToolbar />;

    case "admin":
      return <AdminToolbar />;

    case "hr admin":
    case "hr":
      return <HRAdminToolbar />;

    case "h&s admin":
    case "health & safety admin":
      return <HSAdminToolbar />;

    case "dept. manager":
    case "manager":
      // Both dept managers and shift managers use ManagerToolbar
      // The toolbar itself handles the difference based on permissions
      return (
        <ManagerProvider>
          <ManagerToolbar className={className} />
        </ManagerProvider>
      );

    case "trainer":
      return <TrainerToolbar />;

    case "user":
      return <UserToolbar />;

    case "none":
      // No toolbar
      return null;

    default:
      // Default to user toolbar for unknown access levels
      console.warn(`Unknown access level: ${toolbarType}, defaulting to User Toolbar`);
      return <UserToolbar />;
  }
}
