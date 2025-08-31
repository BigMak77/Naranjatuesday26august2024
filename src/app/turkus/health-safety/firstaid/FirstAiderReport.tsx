import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

interface FirstAider {
  id: string;
  first_name: string;
  last_name: string;
  department: { name: string } | { name?: string } | null;
  is_first_aid: string;
}

export default function FirstAiderReport() {
  const [firstAiders, setFirstAiders] = useState<FirstAider[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, departments(name), is_first_aid")
        .eq("is_first_aid", "YES");
      // Map departments to a single object for each user
      const usersWithDept = (users || []).map((u) => ({
        ...u,
        department: Array.isArray(u.departments)
          ? u.departments[0]
          : u.departments,
      }));
      setFirstAiders(usersWithDept);
      const uniqueDepts = Array.from(
        new Set(usersWithDept.map((u) => u.department?.name).filter(Boolean)),
      );
      setDepartments(uniqueDepts);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered =
    selectedDept === "All"
      ? firstAiders
      : firstAiders.filter((fa) => fa.department?.name === selectedDept);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="first-aider-report-bg">
      <div className="first-aider-report-container">
        <div className="first-aider-report-toolbar">
          <label className="first-aider-report-label">
            Department:
            <select
              className="first-aider-report-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="All">All</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handlePrint}
            className="neon-btn neon-btn-print first-aider-report-print-btn"
            data-variant="print"
          >
            <span style={{ marginRight: "0.5em" }}>Print / Save as PDF</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-printer"
            >
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </button>
        </div>
        <div className="first-aider-report-table-wrapper">
          {loading ? (
            <p className="first-aider-report-loading">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="first-aider-report-empty">
              No first aiders found for this department.
            </p>
          ) : (
            <table className="first-aider-report-table">
              <thead className="first-aider-report-table-head">
                <tr>
                  <th className="first-aider-report-th">Name</th>
                  <th className="first-aider-report-th">Department</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((fa) => (
                  <tr key={fa.id} className="first-aider-report-tr">
                    <td className="first-aider-report-td">
                      {fa.first_name} {fa.last_name}
                    </td>
                    <td className="first-aider-report-td">
                      {fa.department?.name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
