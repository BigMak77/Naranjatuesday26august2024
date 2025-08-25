"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase-client";

type AppUser = {
  id: string;
  email: string | null;
  department_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  access_level?: string | null;
  auth_id?: string; // <-- add auth_id for compatibility
};

type Ctx = { user: AppUser | null; loading: boolean; error?: string | null };

const UserContext = createContext<Ctx>({ user: null, loading: true });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUser() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user: authUser },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      if (!authUser) {
        setUser(null);
        return;
      }

      const { data, error: profileErr } = await supabase
        .from("users")
        .select(
          "id,email,department_id,first_name,last_name,avatar_url,access_level",
        ) // select only what you need
        .eq("auth_id", authUser.id)
        .single();

      if (profileErr) throw profileErr;

      // Fallback: at least return auth email if row missing
      setUser(data ?? { id: authUser.id, email: authUser.email ?? null });
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to load user");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    loadUser();

    // keep in sync with sign-in/out/token refresh
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, loading, error }),
    [user, loading, error],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
