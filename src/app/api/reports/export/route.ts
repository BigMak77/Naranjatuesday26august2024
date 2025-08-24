// src/app/api/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server";

function toCSV<T extends Record<string, unknown>>(rows: T[]): string {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map(h => JSON.stringify(r[h] ?? "")).join(","));
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const { metric_key, grain } = await req.json();
  // ...get rows...
  const rows: Record<string, unknown>[] = []; // replace with real data
  const csv = toCSV(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${metric_key}-${grain}.csv"`
    }
  });
}
