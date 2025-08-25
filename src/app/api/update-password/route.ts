import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { auth_id, new_password } = await req.json();

    if (!auth_id || !new_password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      auth_id,
      {
        password: new_password,
      },
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
