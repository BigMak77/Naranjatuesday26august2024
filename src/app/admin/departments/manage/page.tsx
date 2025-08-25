"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import DepartmentTree from "@/components/DepartmentTree";

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Role {
  id: string;
  title: string;
  department_id: string;
}

export default function ManageDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: deptData, error: deptErr } = await supabase
      .from("departments")
      .select("*");
    const { data: roleData, error: roleErr } = await supabase
      .from("roles")
      .select("*");

    if (deptErr || roleErr) {
      console.error(deptErr || roleErr);
    } else {
      setDepartments(deptData || []);
      setRoles(roleData || []);
    }

    setLoading(false);
  };

  const updateParent = async (deptId: string, newParentId: string) => {
    setUpdatingId(deptId);
    await supabase
      .from("departments")
      .update({ parent_id: newParentId || null })
      .eq("id", deptId);
    await fetchData();
    setUpdatingId(null);
  };

  const getRolesForDept = (deptId: string) => {
    return roles.filter((role) => role.department_id === deptId);
  };

  return (
    <div className="after-hero">
      <div className="global-content">
        <section className="departments-manage-section flex-grow">
          <h1 className="departments-manage-title">Manage Departments</h1>

          {loading ? (
            <div className="text-center text-gray-600">
              Loading departments...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mb-12">
                <table className="departments-manage-table">
                  <thead>
                    <tr>
                      <th className="departments-manage-th">Department</th>
                      <th className="departments-manage-th">
                        Parent Department
                      </th>
                      <th className="departments-manage-th">
                        Associated Roles
                      </th>
                      <th className="departments-manage-th">Change Parent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id} className="departments-manage-tr">
                        <td className="departments-manage-td departments-manage-td-name">
                          {dept.name}
                        </td>
                        <td className="departments-manage-td">
                          {departments.find((d) => d.id === dept.parent_id)
                            ?.name || "—"}
                        </td>
                        <td className="departments-manage-td departments-manage-td-roles">
                          {getRolesForDept(dept.id)
                            .map((role) => role.title)
                            .join(", ") || "—"}
                        </td>
                        <td className="departments-manage-td">
                          <select
                            value={dept.parent_id || ""}
                            onChange={(e) =>
                              updateParent(dept.id, e.target.value)
                            }
                            className="departments-manage-parent-select"
                            disabled={updatingId === dept.id}
                          >
                            <option value="">— No Parent —</option>
                            {departments
                              .filter((d) => d.id !== dept.id)
                              .map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                          </select>
                          {updatingId === dept.id && (
                            <p className="departments-manage-updating-msg">
                              Updating...
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 className="departments-manage-hierarchy-title">
                📂 Department Hierarchy
              </h2>
              <div className="departments-manage-hierarchy-panel">
                <DepartmentTree departments={departments} roles={roles} />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
