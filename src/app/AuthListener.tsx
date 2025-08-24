"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

export default function AuthListener() {
  useEffect(() => {
    supabase.auth.getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      // No-op: user state is not used
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return null;
}
