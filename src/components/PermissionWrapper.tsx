// components/PermissionWrapper.tsx
"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { AccessLevel } from "@/lib/permissions";

interface PermissionWrapperProps {
  children: ReactNode;
  requiredRoles?: AccessLevel[];
  requiredPermission?: keyof typeof import("@/lib/permissions").PERMISSIONS.ADMIN;
  fallback?: ReactNode;
  hideIfNoAccess?: boolean;
}

export default function PermissionWrapper({
  children,
  requiredRoles,
  requiredPermission,
  fallback = null,
  hideIfNoAccess = true,
}: PermissionWrapperProps) {
  const { checkPermission, checkRouteAccess, loading } = usePermissions();

  if (loading) {
    return <div className="neon-info">Loading permissions...</div>;
  }

  let hasAccess = true;

  // Check role-based access
  if (requiredRoles) {
    hasAccess = checkRouteAccess(requiredRoles);
  }

  // Check permission-based access
  if (requiredPermission && hasAccess) {
    hasAccess = checkPermission(requiredPermission);
  }

  if (!hasAccess) {
    if (hideIfNoAccess) {
      return <>{fallback}</>;
    }
    return (
      <div className="neon-error p-4 rounded">
        You don't have permission to view this content.
      </div>
    );
  }

  return <>{children}</>;
}
