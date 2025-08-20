// src/app/api/reports/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { org_id, name, metric_key, grain, from_ts, to_ts, dimensions, filters, chart_type, user_id } = body;

  const { data, error } = await supabase.from("report_definitions").insert({
    org_id, name, metric_key, grain,
    from_ts, to_ts, dimensions, filters, chart_type,
    created_by: user_id
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
