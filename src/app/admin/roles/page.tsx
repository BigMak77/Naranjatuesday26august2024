"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  access_level: string;
  role_title: string;
  status: string;
}

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        setError("Could not load users");
      } else {
        setUsers(data as User[]);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("users")
      .update({ status: newStatus })
      .eq("id", user.id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      );
    } else {
      alert("Failed to update status.");
    }
  };

  const departments = [
    ...new Set(users.map((u) => u.department).filter(Boolean)),
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch = [user.first_name, user.last_name, user.email].some(
      (field) => field?.toLowerCase().includes(search.toLowerCase()),
    );
    const matchesDept = filterDept ? user.department === filterDept : true;
    const matchesStatus = filterStatus ? user.status === filterStatus : true;
    return matchesSearch && matchesDept && matchesStatus;
  });

  if (loading) return <p className="p-6">Loading users...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <>
      <div className="admin-users-page-wrapper">
        <h1 className="admin-users-title">👥 Manage Users</h1>

        {/* Filters */}
        <div className="admin-users-filters">
          <div className="admin-users-filters-row">
            <div
              className="neon-search-bar-wrapper"
              style={{ flex: 1, minWidth: 220 }}
            >
              <input
                type="search"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="neon-input neon-input-search"
              />
            </div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="neon-input w-auto"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="neon-input w-auto"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead className="admin-users-table-head">
              <tr>
                <th className="admin-users-th">Name</th>
                <th className="admin-users-th">Email</th>
                <th className="admin-users-th">Department</th>
                <th className="admin-users-th">Job Level</th>
                <th className="admin-users-th">Role</th>
                <th className="admin-users-th">Status</th>
                <th className="admin-users-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="admin-users-tr">
                  <td className="admin-users-td">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="admin-users-td">{user.email}</td>
                  <td className="admin-users-td">{user.department}</td>
                  <td className="admin-users-td">{user.access_level}</td>
                  <td className="admin-users-td">{user.role_title}</td>
                  <td className="admin-users-td admin-users-status">
                    {user.status}
                  </td>
                  <td className="admin-users-td admin-users-actions">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="admin-users-action-link admin-users-action-view"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="admin-users-action-link admin-users-action-edit"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleStatus(user)}
                      className={`admin-users-action-btn ${user.status === "active" ? "admin-users-action-suspend" : "admin-users-action-reactivate"}`}
                    >
                      {user.status === "active" ? "Suspend" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
