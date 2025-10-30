// This file was moved from /manager/health-safety/page.tsx
"use client";

import HealthSafetyManager from "@/components/userview/HealthSafetyManager";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

export default function HealthSafetyPage() {
  useEffect(() => {
    supabase.auth.getUser();
  }, []);

  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "H&S Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Health & Safety Admin access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Health & Safety Manager"
        description="Manage risk assessments, incidents, policies, and first aid records"
      />
      <HealthSafetyManager />
    </AccessControlWrapper>
  );
}
