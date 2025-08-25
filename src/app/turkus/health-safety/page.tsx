// This file was moved from /manager/health-safety/page.tsx
"use client";

import HealthSafetyManager from "@/components/turkus/HealthSafetyManager";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

export default function HealthSafetyPage() {
  useEffect(() => {
    supabase.auth.getUser();
  }, []);

  return (
    <main>
      <div className="neon-panel">
        <HealthSafetyManager />
      </div>
    </main>
  );
}
