// src/components/reporting/ReportBuilder.tsx
"use client";
import { useState } from "react";
import styles from "./Reporting.module.css";

const METRICS = [
  { key: "forms_submitted", label: "Forms Submitted" },
  { key: "issues_open", label: "Open Issues" },
];

export interface ReportParams {
  metric_key: string;
  grain: string;
  from: string;
  to: string;
  filters: Record<string, string>;
}

export default function ReportBuilder({ onRun }: { onRun: (params: ReportParams) => void }) {
  const [metric, setMetric] = useState(METRICS[0].key);
  const [grain, setGrain] = useState("day");
  const [from, setFrom] = useState(() => new Date(Date.now()-7*864e5).toISOString());
  const [to, setTo] = useState(() => new Date().toISOString());
  const [filters] = useState<Record<string,string>>({});

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label>Metric</label>
          <select className={styles.select} value={metric} onChange={e=>setMetric(e.target.value)}>
            {METRICS.map(m=> <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Grain</label>
          <select className={styles.select} value={grain} onChange={e=>setGrain(e.target.value)}>
            <option>hour</option><option>day</option><option>week</option><option>month</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>From</label>
          <input className={styles.input} type="datetime-local"
                 value={from.slice(0,16)} onChange={e=>setFrom(new Date(e.target.value).toISOString())}/>
        </div>
        <div className={styles.field}>
          <label>To</label>
          <input className={styles.input} type="datetime-local"
                 value={to.slice(0,16)} onChange={e=>setTo(new Date(e.target.value).toISOString())}/>
        </div>
        <button className={styles.btn} onClick={()=>onRun({ metric_key:metric, grain, from, to, filters })}>
          Run
        </button>
      </div>
    </div>
  );
}
