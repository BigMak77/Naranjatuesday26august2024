// src/components/reporting/ReportViewer.tsx
"use client";
import { useMemo, useState } from "react";
import styles from "./Reporting.module.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";

export type ReportRow = { bucket_ts: string | number; value: number | string };

export default function ReportViewer({ rows, chart="line" }: { rows: ReportRow[]; chart?: "line"|"bar"|"table" }) {
  const data = useMemo(()=> rows.map(r => ({ x: r.bucket_ts, y: Number(r.value) })), [rows]);
  const [mode, setMode] = useState(chart);

  if (!rows?.length) return <div className={styles.panel}>No data</div>;

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <button className={styles.btn} onClick={()=>setMode("line")}>Line</button>
        <button className={styles.btn} onClick={()=>setMode("bar")}>Bar</button>
        <button className={styles.btn} onClick={()=>setMode("table")}>Table</button>
      </div>

      {mode !== "table" && (
        <div className={styles.chartWrap}>
          <ResponsiveContainer>
            {mode === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="y" dot={false} />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="y" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {mode === "table" && (
        <table className={styles.table}>
          <thead><tr><th>Time</th><th>Value</th></tr></thead>
          <tbody>{rows.map((r,i)=>(<tr key={i}><td>{r.bucket_ts}</td><td>{r.value}</td></tr>))}</tbody>
        </table>
      )}
    </div>
  );
}
