import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

type Auditor = {
  id: string;
  first_name: string;
  last_name: string;
  department_id?: string;
  department_name?: string;
};

export default function AuditorsListWidget() {
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    // Fetch auditors and their department names
    Promise.all([
      supabase
        .from("users")
        .select("id, first_name, last_name, department_id")
        .eq("is_auditor", true)
        .order("first_name", { ascending: true }),
      supabase
        .from("departments")
        .select("id, name"),
    ]).then(([userRes, deptRes]) => {
      setLoading(false);
      if (userRes.error) setError("Failed to load auditors");
      else if (deptRes.error) setError("Failed to load departments");
      else {
        const deptMap = new Map<string, string>();
        (deptRes.data || []).forEach((d: { id: string; name: string }) => {
          deptMap.set(d.id, d.name);
        });
        const auditors = (userRes.data || []).map((a: Auditor) => ({
          ...a,
          department_name: a.department_id ? deptMap.get(a.department_id) || "—" : "—",
        }));
        setAuditors(auditors);
      }
    });
  }, []);

  return (
    <div className="neon-panel" style={{ marginTop: 24 }}>
      <h3 className="neon-section-title">Current Auditors</h3>
      {loading ? (
        <div className="neon-info">Loading...</div>
      ) : error ? (
        <div className="neon-error">{error}</div>
      ) : auditors.length === 0 ? (
        <div className="neon-info">No auditors found.</div>
      ) : (
        <table className="neon-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Name</th>
              <th style={{ textAlign: 'left' }}>Department</th>
            </tr>
          </thead>
          <tbody>
            {auditors.map((a) => (
              <tr key={a.id}>
                <td>{a.first_name} {a.last_name}</td>
                <td>{a.department_name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
