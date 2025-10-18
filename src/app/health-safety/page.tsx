// This file was moved from /manager/health-safety/page.tsx
"use client";

import HealthSafetyManager from "@/components/userview/HealthSafetyManager";
import MainHeader from "@/components/ui/MainHeader";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

export default function HealthSafetyPage() {
  useEffect(() => {
    supabase.auth.getUser();
  }, []);

  return (
    <>
      <MainHeader
        title="Health & Safety Manager"
        subtitle="Manage risk assessments, incidents, policies, and first aid records"
      />
      <main className="after-hero global-content">
        <HealthSafetyManager />
      </main>
    </>
  );
}
