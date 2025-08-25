// lib/useUser.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase-client";

export function useUser() {
  const [user, setUser] = useState<{
    id?: string;
    auth_id: string;
    access_level: string; // changed from number to string
    department_id: string;
    first_name?: string;
    last_name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
        error: sessionError,
      } = await supabase.auth.getUser();

      if (sessionError || !authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select(
          "id, auth_id, access_level, department_id, first_name, last_name",
        )
        .eq("auth_id", authUser.id)
        .single();

      if (error || !data) {
        setUser(null);
      } else {
        // Ensure access_level is a string
        setUser({ ...data, access_level: String(data.access_level) });
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  return { user, loading };
}
