import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.log("❌ No token provided");
      return NextResponse.json(
        { code: "not_authenticated", message: "No token provided" },
        { status: 401 },
      );
    }

    // 2. Create a Supabase client using the user's token
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    // 3. Get the currently logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("❌ Auth user fetch failed:", userError);
      return NextResponse.json(
        { code: "not_authenticated", message: "User not found" },
        { status: 401 },
      );
    }

    console.log("✅ Authenticated user ID:", user.id);

    // 4. Check access_level from your users table using auth_id
    const { data: userMeta, error: metaError } = await supabaseAdmin
      .from("users")
      .select("access_level")
      .eq("auth_id", user.id)
      .single();

    console.log("🔎 userMeta:", userMeta);
    console.log("🔎 metaError:", metaError);

    if (metaError || !userMeta || userMeta.access_level !== "Admin") {
      console.log("⛔ Access denied. Not an Admin.");
      return NextResponse.json(
        { code: "not_admin", message: "User not allowed" },
        { status: 403 },
      );
    }

    // 5. Get payload from body
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 },
      );
    }

    // 6. Create new user via Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("🔥 Supabase Admin error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (err: unknown) {
    console.error("💥 Unexpected server error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
