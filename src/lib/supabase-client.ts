import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized");
    console.log("Supabase URL:", supabaseUrl);
    console.log("Supabase Key:", supabaseAnonKey?.slice(0, 8) + "...");
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
