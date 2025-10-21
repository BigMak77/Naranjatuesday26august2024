"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { user, loading } = useUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push("/login");
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
      router.push(redirectUrl);
    }
  }, [allowedRoles, user, loading, router, redirectTo]);

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
