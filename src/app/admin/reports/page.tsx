// src/app/reports/page.tsx
"use client";
import { useState } from "react";
import ReportBuilder from "@/components/reporting/ReportBuilder";
import ReportViewer from "@/components/reporting/ReportViewer";

// Use types from components for consistency
import type { ReportParams } from "@/components/reporting/ReportBuilder";
import type { ReportRow } from "@/components/reporting/ReportViewer";

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const run = (params: ReportParams) => {
    async function fetchData() {
      const res = await fetch("/api/reports/run", {
        method: "POST",
        body: JSON.stringify({ org_id: "YOUR_ORG_ID", ...params }),
      });
      const json = await res.json();
      setRows(json.rows ?? []);
    }
    fetchData();
  };
  return (
    <main>
      <h1>Reports</h1>
      <ReportBuilder onRun={run} />
      <ReportViewer rows={rows} />
    </main>
  );
}
