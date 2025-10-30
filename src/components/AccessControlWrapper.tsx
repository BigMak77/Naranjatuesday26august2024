"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouterSafe } from "@/lib/useRouterSafe";
import { useUser } from "@/lib/useUser";
import { AccessLevel, canAccessRoute, getDashboardUrl, hasPermission } from "@/lib/permissions";

interface AccessControlWrapperProps {
  children: ReactNode;
  
  // Role-based access
  requiredRoles?: AccessLevel | AccessLevel[];
  
  // Permission-based access
  requiredPermission?: keyof typeof import("@/lib/permissions").PERMISSIONS.ADMIN;
  
  // Behavior options
  fallback?: ReactNode;
  hideIfNoAccess?: boolean;
  redirectOnNoAccess?: boolean;
  redirectTo?: string;
  
  // Custom access check function
  customAccessCheck?: (user: any) => boolean;
  
  // Loading state
  loadingComponent?: ReactNode;
  
  // Error messages
  noAccessMessage?: string;
}

/**
 * Unified Access Control Wrapper
 * 
 * This component consolidates all access control logic into a single, consistent interface.
 * It replaces PermissionWrapper, RequireAccess, and ManagerAccessGuard.
 * 
 * Features:
 * - Role-based access control
 * - Permission-based access control
 * - Custom access check functions
 * - Flexible fallback behavior (hide, show message, or redirect)
 * - Consistent loading states
 * - Better error handling
 */
export default function AccessControlWrapper({
  children,
  requiredRoles,
  requiredPermission,
  fallback = null,
  hideIfNoAccess = false,
  redirectOnNoAccess = false,
  redirectTo,
  customAccessCheck,
  loadingComponent,
  noAccessMessage = "You don't have permission to access this content.",
}: AccessControlWrapperProps) {
  const router = useRouterSafe();
  const { user, loading } = useUser();
  const [accessState, setAccessState] = useState<'loading' | 'allowed' | 'denied' | null>(null);

  useEffect(() => {
    if (loading) {
      setAccessState('loading');
      return;
    }

    if (!user) {
      if (redirectOnNoAccess) {
        router.push("/login", 500);
        return;
      }
      setAccessState('denied');
      return;
    }

    let hasAccess = true;

    // Check custom access function first
    if (customAccessCheck) {
      hasAccess = customAccessCheck(user);
    } else {
      // Check role-based access
      if (requiredRoles) {
        const allowedLevels = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        hasAccess = canAccessRoute(user.access_level, allowedLevels);
      }

      // Check permission-based access (only if role check passed)
      if (requiredPermission && hasAccess) {
        hasAccess = hasPermission(user.access_level, requiredPermission);
      }
    }

    if (hasAccess) {
      setAccessState('allowed');
    } else {
      setAccessState('denied');
      
      // Handle redirect behavior
      if (redirectOnNoAccess) {
        const redirectUrl = redirectTo || getDashboardUrl(user.access_level);
        router.push(redirectUrl, 500);
      }
    }
  }, [user, loading, requiredRoles, requiredPermission, customAccessCheck, redirectOnNoAccess, redirectTo]); // Remove router from dependency array to prevent navigation loops

  // Loading state
  if (accessState === 'loading') {
    return loadingComponent || (
      <div className="neon-info p-4 rounded text-center">
        Checking access permissions...
      </div>
    );
  }

  // Access denied
  if (accessState === 'denied') {
    if (hideIfNoAccess) {
      return <>{fallback}</>;
    }
    
    return fallback || (
      <div className="neon-error p-4 rounded text-center">
        {noAccessMessage}
      </div>
    );
  }

  // Access granted
  if (accessState === 'allowed') {
    return <>{children}</>;
  }

  // Default loading state (shouldn't reach here normally)
  return loadingComponent || (
    <div className="neon-info p-4 rounded text-center">
      Loading...
    </div>
  );
}
