// src/app/api/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { compile } from "@/lib/sqlTemplate";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function toCSV(rows: any[]): string {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map(h => JSON.stringify(r[h] ?? "")).join(","));
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const { org_id, metric_key, grain, from, to, filters } = await req.json();
  // (Reuse metric fetching + compile like /run)
  // ...get rows...
  const rows = []; // replace with real data
  const csv = toCSV(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${metric_key}-${grain}.csv"`
    }
  });
}
