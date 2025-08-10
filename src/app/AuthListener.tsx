"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function AuthListener() {
  useEffect(() => {
    supabase.auth.getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (
        _event: import('@supabase/supabase-js').AuthChangeEvent,
        _session: import('@supabase/supabase-js').Session | null
      ) => {
        // No-op: user state is not used
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return null;
}
