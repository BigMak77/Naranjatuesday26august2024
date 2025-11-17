"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiDownload, FiFilter, FiCheck, FiClock } from "react-icons/fi";
import TextIconButton from "../ui/TextIconButtons";

interface ConfirmationReportRow {
  assignment_id: string;
  user_name: string;
  user_email: string;
  department: string | null;
  item_title: string;
  item_type: string;
  reference_code: string | null;
  assigned_at: string;
  confirmed_at: string;
  confirmation_signature: string;
  hours_to_confirm: number;
}

interface ConfirmationReportAdminProps {
  departmentFilter?: string;
  itemTypeFilter?: "document" | "module";
  dateRange?: { from: string; to: string };
}

export default function ConfirmationReportAdmin({
  departmentFilter,
  itemTypeFilter,
  dateRange,
}: ConfirmationReportAdminProps) {
  const [confirmations, setConfirmations] = useState<ConfirmationReportRow[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(
    departmentFilter || "all"
  );
  const [selectedItemType, setSelectedItemType] = useState(
    itemTypeFilter || "all"
  );

  useEffect(() => {
    fetchConfirmations();
  }, [selectedDepartment, selectedItemType, dateRange]);

  const fetchConfirmations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("confirmation_report")
        .select("*")
        .order("confirmed_at", { ascending: false });

      if (selectedDepartment && selectedDepartment !== "all") {
        query = query.eq("department", selectedDepartment);
      }

      if (selectedItemType && selectedItemType !== "all") {
        query = query.eq("item_type", selectedItemType);
      }

      if (dateRange) {
        query = query
          .gte("confirmed_at", dateRange.from)
          .lte("confirmed_at", dateRange.to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setConfirmations(data || []);
    } catch (err) {
      console.error("Error fetching confirmations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load confirmations"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredConfirmations = confirmations.filter((c) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.user_name?.toLowerCase().includes(search) ||
      c.user_email?.toLowerCase().includes(search) ||
      c.item_title?.toLowerCase().includes(search) ||
      c.department?.toLowerCase().includes(search)
    );
  });

  const exportToCSV = () => {
    if (!filteredConfirmations.length) return;

    const headers = [
      "User Name",
      "Email",
      "Department",
      "Item Type",
      "Item Title",
      "Reference Code",
      "Assigned At",
      "Confirmed At",
      "Signature",
      "Hours to Confirm",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredConfirmations.map((c) =>
        [
          c.user_name || "",
          c.user_email || "",
          c.department || "",
          c.item_type || "",
          c.item_title || "",
          c.reference_code || "",
          new Date(c.assigned_at).toLocaleString(),
          new Date(c.confirmed_at).toLocaleString(),
          c.confirmation_signature || "",
          c.hours_to_confirm?.toFixed(2) || "",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `confirmation-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueDepartments = Array.from(
    new Set(confirmations.map((c) => c.department).filter((dept): dept is string => Boolean(dept)))
  ).sort();

  const stats = {
    total: filteredConfirmations.length,
    avgHours:
      filteredConfirmations.reduce((sum, c) => sum + (c.hours_to_confirm || 0), 0) /
      (filteredConfirmations.length || 1),
    byDepartment: filteredConfirmations.reduce((acc, c) => {
      const dept = c.department || "Unknown";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  if (loading) {
    return (
      <div className="neon-card">
        <div className="neon-card-body">
          <p className="text-gray-400">Loading confirmation report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neon-card">
        <div className="neon-card-body">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neon-card">
          <div className="neon-card-body">
            <div className="flex items-center gap-3">
              <FiCheck className="text-green-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Confirmations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="neon-card">
          <div className="neon-card-body">
            <div className="flex items-center gap-3">
              <FiClock className="text-blue-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.avgHours.toFixed(1)}h
                </p>
                <p className="text-sm text-gray-400">Avg Time to Confirm</p>
              </div>
            </div>
          </div>
        </div>

        <div className="neon-card">
          <div className="neon-card-body">
            <div className="flex items-center gap-3">
              <FiFilter className="text-purple-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">
                  {Object.keys(stats.byDepartment).length}
                </p>
                <p className="text-sm text-gray-400">Departments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Report Card */}
      <div className="neon-card">
        <div className="neon-card-header">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="neon-card-title">Confirmation Report</h3>

            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neon-input text-sm"
                style={{ maxWidth: "200px" }}
              />

              {/* Department Filter */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="neon-input text-sm"
                style={{ maxWidth: "150px" }}
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Item Type Filter */}
              <select
                value={selectedItemType}
                onChange={(e) =>
                  setSelectedItemType(e.target.value as "document" | "module" | "all")
                }
                className="neon-input text-sm"
                style={{ maxWidth: "120px" }}
              >
                <option value="all">All Types</option>
                <option value="document">Documents</option>
                <option value="module">Modules</option>
              </select>

              {/* Export Button */}
              <TextIconButton
                variant="primary"
                icon={<FiDownload />}
                label="Export CSV"
                onClick={exportToCSV}
                disabled={filteredConfirmations.length === 0}
              />
            </div>
          </div>
        </div>

        <div className="neon-card-body">
          {filteredConfirmations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No confirmations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="neon-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Department</th>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Assigned</th>
                    <th>Confirmed</th>
                    <th>Time</th>
                    <th>Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConfirmations.map((confirmation) => (
                    <tr key={confirmation.assignment_id}>
                      <td>
                        <div>
                          <p className="font-medium">{confirmation.user_name}</p>
                          <p className="text-xs text-gray-400">
                            {confirmation.user_email}
                          </p>
                        </div>
                      </td>
                      <td>{confirmation.department || "—"}</td>
                      <td>
                        <div>
                          <p className="font-medium">{confirmation.item_title}</p>
                          {confirmation.reference_code && (
                            <p className="text-xs text-gray-400">
                              {confirmation.reference_code}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="neon-badge">
                          {confirmation.item_type}
                        </span>
                      </td>
                      <td className="text-sm">
                        {new Date(confirmation.assigned_at).toLocaleDateString()}
                      </td>
                      <td className="text-sm">
                        {new Date(confirmation.confirmed_at).toLocaleDateString()}
                      </td>
                      <td className="text-sm">
                        {confirmation.hours_to_confirm?.toFixed(1)}h
                      </td>
                      <td className="text-sm">
                        {confirmation.confirmation_signature}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="neon-card-footer">
          <p className="text-sm text-gray-400">
            Showing {filteredConfirmations.length} of {confirmations.length}{" "}
            confirmations
          </p>
        </div>
      </div>
    </div>
  );
}
