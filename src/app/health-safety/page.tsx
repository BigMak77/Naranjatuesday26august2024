// This file was moved from /manager/health-safety/page.tsx
"use client";

import { Suspense } from "react";
import HealthSafetyManager from "@/components/userview/HealthSafetyManager";
import ContentHeader from "@/components/ui/ContentHeader";

export default function HealthSafetyPage() {
  console.log('[HealthSafetyPage] Rendering health-safety page');

  return (
    <>
      <ContentHeader
        title="Health & Safety Manager"
        description="Manage risk assessments, incidents, policies, and first aid records"
      />
      <Suspense fallback={<div>Loading...</div>}>
        <HealthSafetyManager />
      </Suspense>
    </>
  );
}
