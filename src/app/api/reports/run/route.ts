// src/app/api/reports/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { compile } from "@/lib/sqlTemplate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STEP_BY_GRAIN: Record<string, string> = {
  hour:  "1 hour",
  day:   "1 day",
  week:  "1 week",
  month: "1 month",
};

export async function POST(req: NextRequest) {
  try {
    const { metric_key, grain = "day", from, to, filters = {} } = await req.json();

    if (!metric_key || !from || !to) {
      return NextResponse.json({ error: "metric_key, from, and to are required" }, { status: 400 });
    }

    // 1) fetch metric
    const { data: metric, error: mErr } = await supabase
      .from("metrics")
      .select("sql")
      .eq("key", metric_key)
      .single();

    if (mErr || !metric?.sql) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    // 2) compile placeholders WITH quotes
    // If the metric uses {{step}}, provide it. If not, compile ignores it.
    const step = STEP_BY_GRAIN[grain] ?? "1 day";
    let sql = compile(metric.sql, {
      grain: `'${grain}'`,
      step:  `'${step}'`,
      from:  `'${from}'`,
      to:    `'${to}'`,
    });

    // 3) optional: inject simple equality filters before GROUP BY
    if (Object.keys(filters).length) {
      sql = sql.replace(/GROUP BY\s+1\b/i, match => {
        const ands = Object.entries(filters)
          .map(([k, v]) => `AND ${k} = '${String(v).replaceAll("'", "''")}'`)
          .join("\n  ");
        return `${ands}\n${match}`;
      });
    }

    // 4) run the **typed** RPC so PostgREST can materialize columns
    // run_metric RETURNS TABLE (bucket_ts timestamptz, value numeric)
    const { data, error } = await supabase.rpc("run_metric", { q: sql });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
