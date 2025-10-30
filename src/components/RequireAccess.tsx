"use client";

import { useEffect, useState } from "react";
import { useRouterSafe } from "@/lib/useRouterSafe";
import { useUser } from "@/lib/useUser";
import { AccessLevel, canAccessRoute, getDashboardUrl } from "@/lib/permissions";

interface Props {
  allowedRoles: AccessLevel | AccessLevel[];
  children: React.ReactNode;
  fallbackMessage?: string;
  redirectTo?: string;
}

export default function RequireAccess({ 
  allowedRoles, 
  children, 
  fallbackMessage = "You don't have permission to access this page.",
  redirectTo 
}: Props) {
  const router = useRouterSafe();
  const { user, loading } = useUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push("/login", 500);
      return;
    }

    const allowedLevels = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasAccess = canAccessRoute(user.access_level, allowedLevels);
    
    if (hasAccess) {
      setAllowed(true);
    } else {
      setAllowed(false);
      
      // Redirect to specified URL or user's appropriate dashboard
      const redirectUrl = redirectTo || getDashboardUrl(user.access_level);
      router.push(redirectUrl, 500);
    }
  }, [allowedRoles, user, loading, redirectTo]); // Remove router from dependency array to prevent navigation loops

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="neon-info">Checking access...</div>
      </div>
    );
  }

  if (allowed === null) {
    return (
      <div className="p-10 text-center">
        <div className="neon-info">Loading...</div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-10 text-center">
        <div className="neon-error">{fallbackMessage}</div>
      </div>
    );
  }

  return <>{children}</>;
}
