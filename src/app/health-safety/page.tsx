// This file was moved from /manager/health-safety/page.tsx
"use client";

import HealthSafetyManager from "@/components/userview/HealthSafetyManager";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { usePermissions } from "@/lib/usePermissions";

export default function HealthSafetyPage() {
  const { canAddRiskAssessment, canAddFirstAidReport, isHSAdmin, isSuperAdmin, isAdmin } = usePermissions();

  useEffect(() => {
    supabase.auth.getUser();
  }, []);

  const evaluatePermission = (v: any) => (typeof v === "function" ? v() : Boolean(v));

  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "H&S Admin"]}
      customAccessCheck={(user) => {
        // Allow access if user is admin, H&S admin, or has safety rep/first aider permissions
        return (
          evaluatePermission(canAddRiskAssessment) ||
          evaluatePermission(canAddFirstAidReport) ||
          evaluatePermission(isHSAdmin) ||
          evaluatePermission(isSuperAdmin) ||
          evaluatePermission(isAdmin)
        );
      }}
      redirectOnNoAccess={true}
      noAccessMessage="Health & Safety access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Health & Safety Manager"
        description="Manage risk assessments, incidents, policies, and first aid records"
      />
      <HealthSafetyManager />
    </AccessControlWrapper>
  );
}
