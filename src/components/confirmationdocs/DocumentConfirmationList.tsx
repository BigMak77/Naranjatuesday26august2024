"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiCheck, FiX, FiDownload } from "react-icons/fi";
import TextIconButton from "../ui/TextIconButtons";

export interface ConfirmationListRecord {
  id: string;
  document_title: string;
  reference_code: string | null;
  user_email: string | null;
  user_name: string | null;
  profile_name: string | null;
  department: string | null;
  signature: string | null;
  confirmed_at: string;
  ip_address: string | null;
}

interface DocumentConfirmationListProps {
  documentId: string;
  documentTitle?: string;
}

export default function DocumentConfirmationList({
  documentId,
  documentTitle,
}: DocumentConfirmationListProps) {
  const [confirmations, setConfirmations] = useState<ConfirmationListRecord[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfirmations();
  }, [documentId]);

  const fetchConfirmations = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("document_confirmation_report")
        .select("*")
        .eq("document_id", documentId)
        .order("confirmed_at", { ascending: false });

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

  const exportToCSV = () => {
    if (!confirmations.length) return;

    const headers = [
      "Name",
      "Email",
      "Department",
      "Signature",
      "Confirmed At",
      "IP Address",
    ];
    const csvContent = [
      headers.join(","),
      ...confirmations.map((c) =>
        [
          c.profile_name || c.user_name || "",
          c.user_email || "",
          c.department || "",
          c.signature || "",
          new Date(c.confirmed_at).toLocaleString(),
          c.ip_address || "",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `confirmations-${documentTitle || documentId}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="neon-card">
        <div className="neon-card-body">
          <p className="text-gray-400">Loading confirmations...</p>
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
    <div className="neon-card">
      <div className="neon-card-header">
        <div className="flex items-center justify-between">
          <h3 className="neon-card-title">
            Document Confirmations
            {documentTitle && `: ${documentTitle}`}
          </h3>
          <div className="flex gap-2">
            <span className="text-sm text-gray-400">
              {confirmations.length} confirmation
              {confirmations.length !== 1 ? "s" : ""}
            </span>
            {confirmations.length > 0 && (
              <TextIconButton
                variant="primary"
                icon={<FiDownload />}
                label="Export CSV"
                onClick={exportToCSV}
              />
            )}
          </div>
        </div>
      </div>

      <div className="neon-card-body">
        {confirmations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FiX className="mx-auto mb-2" size={32} />
            <p>No confirmations recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="neon-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Signature</th>
                  <th>Confirmed At</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {confirmations.map((confirmation) => (
                  <tr key={confirmation.id}>
                    <td>
                      {confirmation.profile_name ||
                        confirmation.user_name ||
                        "—"}
                    </td>
                    <td>{confirmation.user_email || "—"}</td>
                    <td>{confirmation.department || "—"}</td>
                    <td>{confirmation.signature || "—"}</td>
                    <td>
                      {new Date(confirmation.confirmed_at).toLocaleString()}
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <FiCheck />
                        <span className="text-xs">Confirmed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
