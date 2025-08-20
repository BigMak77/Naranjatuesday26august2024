// src/app/reports/page.tsx
"use client";
import { useState } from "react";
import ReportBuilder from "@/components/reporting/ReportBuilder";
import ReportViewer from "@/components/reporting/ReportViewer";

export default function ReportsPage() {
  type ReportRow = { [key: string]: unknown }; // Replace 'unknown' with specific field types if known
  const [rows, setRows] = useState<ReportRow[]>([]);
  async function run(params: Record<string, unknown>) {
    const res = await fetch("/api/reports/run", { method:"POST", body: JSON.stringify({ org_id: "YOUR_ORG_ID", ...params }) });
    const json = await res.json();
    setRows(json.rows ?? []);
  }
  return (
    <main>
      <h1>Reports</h1>
      <ReportBuilder onRun={run}/>
      <ReportViewer rows={rows}/>
    </main>
  );
}
