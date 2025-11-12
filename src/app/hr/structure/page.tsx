"use client";

import { useEffect } from 'react';
import { useRouterSafe } from '@/lib/useRouterSafe';
import ContentHeader from '@/components/ui/ContentHeader';
import AccessControlWrapper from '@/components/AccessControlWrapper';

export default function StructurePage() {
  const router = useRouterSafe();

  useEffect(() => {
    // Use safe router with debounce to prevent excessive replaceState calls
    router.replace('/hr/structure/role-structure', 500);
  }, []); // Empty dependency array to prevent re-renders

  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to access structure management."
    >
      <div className="after-hero global-content relative">
        <div className="flex-1 min-w-0">
          <ContentHeader
            title="Structure Management"
            description="Redirecting to role structure page..."
          />
          <div className="neon-panel">
            <p className="text-center py-8 text-neon">
              Redirecting to structure page...
            </p>
          </div>
        </div>
      </div>
    </AccessControlWrapper>
  );
}
