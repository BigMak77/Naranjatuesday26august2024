import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Papa from "papaparse";
import NeonTable from "@/components/NeonTable";
import ContentHeader from "@/components/headersandfooters/ContentHeader";
import MainHeader from "@/components/ui/MainHeader";

interface ComplianceRow {
  auth_id: string;
  user_name: string;
  department: string;
  role: string;
  module: string;
  status: string;
  completed_at?: string;
}

export default function ComplianceDashboard() {
  const [data, setData] = useState<ComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (expand as needed)
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");

  // Fetch filter options
  const [deptOptions, setDeptOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      // TODO: Replace with your actual compliance query or API call
      // Example: fetch all required modules and completion status for all users
      const { data: rows, error } = await supabase.rpc(
        "compliance_dashboard_view",
        {
          department: selectedDept !== "all" ? selectedDept : null,
          role: selectedRole !== "all" ? selectedRole : null,
          module: selectedModule !== "all" ? selectedModule : null,
        },
      );
      if (error) setError(error.message);
      setData(rows || []);
      setLoading(false);
    };
    fetchData();
  }, [selectedDept, selectedRole, selectedModule]);

  useEffect(() => {
    // Fetch filter options on mount
    const fetchOptions = async () => {
      const { data: depts } = await supabase.from("departments").select("name");
      setDeptOptions(depts ? depts.map((d: { name: string }) => d.name) : []);
      const { data: roles } = await supabase.from("roles").select("title");
      setRoleOptions(roles ? roles.map((r: { title: string }) => r.title) : []);
      const { data: modules } = await supabase.from("modules").select("name");
      setModuleOptions(
        modules ? modules.map((m: { name: string }) => m.name) : [],
      );
    };
    fetchOptions();
  }, []);

  const handleCSVExport = async () => {
    // TODO: Implement CSV export logic
    // Example: Convert current data view to CSV and trigger download
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compliance_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <MainHeader title="Compliance Dashboard" subtitle="Track training and module completion across all users" />
      <ContentHeader title="Compliance Dashboard" />
      <div className="neon-panel">
        <h2 className="neon-form-title">Compliance Dashboard</h2>
        {/* Filters */}
        <div className="neon-form-actions" style={{ flexWrap: "wrap" }}>
          <div>
            <label>Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="neon-input"
            >
              <option value="all">All</option>
              {deptOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="neon-input"
            >
              <option value="all">All</option>
              {roleOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Module</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="neon-input"
            >
              <option value="all">All</option>
              {moduleOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="neon-form-actions neon-flex-wrap">
          <button type="button" onClick={handleCSVExport} className="neon-btn neon-btn-square">
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              const template = [
                {
                  auth_id: "",
                  first_name: "",
                  last_name: "",
                  department_id: "",
                  email: "",
                  nationality: "",
                  access_level: "",
                  shift: "",
                  phone: "",
                  department_name: "",
                  role_title: "",
                  start_date: "",
                },
              ];
              const csv = Papa.unparse(template);
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "user_template.csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="neon-btn neon-btn-square"
          >
            Download CSV Template
          </button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="neon-error">{error}</p>
        ) : data.length === 0 ? (
          <p>No compliance data found.</p>
        ) : (
          <NeonTable
            columns={[
              { header: "User", accessor: "auth_id" },
              { header: "Department", accessor: "department" },
              { header: "Role", accessor: "role" },
              { header: "Module", accessor: "module" },
              { header: "Status", accessor: "status" },
              { header: "Completed At", accessor: "completed_at" },
            ]}
            data={data.map((row) => ({
              auth_id: row.auth_id,
              department: row.department,
              role: row.role,
              module: row.module,
              status: row.status,
              completed_at: row.completed_at
                ? new Date(row.completed_at).toLocaleDateString("en-GB")
                : "—",
            }))}
          />
        )}
      </div>
    </>
  );
}
