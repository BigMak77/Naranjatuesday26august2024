"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string | null;
  access_level: string;
}

interface Department {
  id: string;
  name: string;
}

const DepartmentNoManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: userRows, error: userError },
          { data: deptRows, error: deptError }
        ] = await Promise.all([
          supabase.from("users").select("id, department_id, access_level, first_name, last_name, email"),
          supabase.from("departments").select("id, name")
        ]);

        if (userError) {
          console.error("Error fetching users:", userError);
          setError(`Failed to fetch users: ${userError.message}`);
        }
        if (deptError) {
          console.error("Error fetching departments:", deptError);
          setError(`Failed to fetch departments: ${deptError.message}`);
        }

        setUsers(userRows || []);
        setDepartments(deptRows || []);
      } catch (error: any) {
        console.error("Error in fetchData:", error);
        setError(error.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper: find users without a manager in their department
  const usersWithoutManager = users.filter(u => {
    if (!u.department_id) return false;
    // Find a manager in the same department (access_level === 'manager', case-insensitive)
    return !users.some(
      (other) =>
        other.id !== u.id &&
        typeof other.access_level === 'string' &&
        other.access_level.toLowerCase() === 'manager' &&
        other.department_id === u.department_id
    );
  });

  // Helper: get department(s) managed by a user
  const getManagedDepartments = (userId: string) => {
    // Find departments where this user is a manager
    const user = users.find(u => u.id === userId);
    if (!user || !user.department_id) return '';

    const dept = departments.find(d => d.id === user.department_id);
    return dept ? dept.name : '';
  };

  if (loading) {
    return <div className="user-manager-loading">Loading...</div>;
  }

  if (error) {
    return <div className="user-manager-error">{error}</div>;
  }

  return (
    <div>
      <h3 className="neon-heading user-manager-subheading">
        Users Without Manager ({usersWithoutManager.length})
      </h3>
      <p style={{ color: "#40e0d0", fontSize: "0.875rem", marginBottom: "1rem" }}>
        These users are in departments that don't have anyone with a manager access level assigned.
      </p>
      <table className="neon-table user-manager-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
          {usersWithoutManager.length === 0 ? (
            <tr><td colSpan={3} className="user-manager-empty">All users have a manager</td></tr>
          ) : (
            usersWithoutManager.map((user) => (
              <tr key={user.id}>
                <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                <td>{user.email}</td>
                <td>{getManagedDepartments(user.id)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentNoManager;
