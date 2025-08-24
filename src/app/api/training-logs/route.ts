// app/api/training-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

type Outcome = "completed" | "needs-followup";
type Payload = {
  auth_id?: string;
  date?: string;            // "YYYY-MM-DD"
  topic?: string;
  duration_hours?: number;  // number
  outcome?: Outcome;
  notes?: string | null;
  signature?: string;       // base64 data URL (text)
};

function isValidDateYYYYMMDD(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime());
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "POST here to insert" });
}

export async function POST(req: NextRequest) {
  try {
    const body: Payload = await req.json();
    const { auth_id, date, topic, duration_hours, outcome, notes, signature } = body || {};

    // Validate required fields
    if (!auth_id || !date || !topic || duration_hours == null || !outcome || !signature) {
      return NextResponse.json({ error: "Missing required fields", body }, { status: 400 });
    }
    if (!isValidDateYYYYMMDD(date)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD." }, { status: 400 });
    }
    if (outcome !== "completed" && outcome !== "needs-followup") {
      return NextResponse.json({ error: "Invalid outcome value." }, { status: 400 });
    }

    // Optional: ensure auth_id exists in your users table (comment out if not needed)
    const { data: u, error: lookupErr } = await admin
      .from("users")
      .select("id")
      .eq("auth_id", auth_id)
      .single();

    if (lookupErr || !u) {
      return NextResponse.json(
        { error: "No user found for supplied auth_id.", details: lookupErr?.message },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("training_logs")
      .insert([
        {
          auth_id,           // ← store auth_id, not user_id
          date,
          topic,
          duration_hours,
          outcome,
          notes: notes ?? null,
          signature,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details, hint: (error as { hint?: string })?.hint },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || "Unexpected server error" }, { status: 500 });
  }
}
