// components/ProtectedNavLink.tsx
"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { AccessLevel } from "@/lib/permissions";

interface ProtectedNavLinkProps {
  href: string;
  children: ReactNode;
  requiredRoles?: AccessLevel[];
  requiredPermission?: keyof typeof import("@/lib/permissions").PERMISSIONS.ADMIN;
  className?: string;
  activeClassName?: string;
}

export default function ProtectedNavLink({
  href,
  children,
  requiredRoles,
  requiredPermission,
  className = "",
  activeClassName = "",
}: ProtectedNavLinkProps) {
  const { checkPermission, checkRouteAccess, loading } = usePermissions();

  if (loading) {
    return null; // Don't show anything while loading
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
    return null; // Don't render the link if no access
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
