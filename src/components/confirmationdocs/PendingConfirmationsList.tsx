"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiAlertCircle, FiFileText, FiBook, FiCheck } from "react-icons/fi";
import TextIconButton from "../ui/TextIconButtons";

interface PendingConfirmation {
  assignment_id: string;
  item_id: string;
  item_type: string;
  item_title: string;
  reference_code: string | null;
  document_url: string | null;
  assigned_at: string;
  due_at: string | null;
}

interface PendingConfirmationsListProps {
  userId: string;
  onConfirmClick?: (assignmentId: string) => void;
  showCount?: boolean;
}

export default function PendingConfirmationsList({
  userId,
  onConfirmClick,
  showCount = false,
}: PendingConfirmationsListProps) {
  const [confirmations, setConfirmations] = useState<PendingConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingConfirmations();
  }, [userId]);

  const fetchPendingConfirmations = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("pending_confirmations")
        .select("*")
        .eq("auth_id", userId)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("assigned_at", { ascending: false });

      if (fetchError) throw fetchError;
      setConfirmations(data || []);
    } catch (err) {
      console.error("Error fetching pending confirmations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load confirmations"
      );
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="neon-card">
        <div className="neon-card-body">
          <p className="text-gray-400">Loading pending confirmations...</p>
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

  if (showCount && confirmations.length === 0) {
    return null;
  }

  if (confirmations.length === 0) {
    return (
      <div className="neon-card">
        <div className="neon-card-header">
          <h3 className="neon-card-title">Pending Confirmations</h3>
        </div>
        <div className="neon-card-body">
          <div className="text-center py-8 text-gray-400">
            <FiCheck className="mx-auto mb-2" size={32} />
            <p>No pending confirmations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neon-card">
      <div className="neon-card-header">
        <div className="flex items-center justify-between">
          <h3 className="neon-card-title">Pending Confirmations</h3>
          <span className="neon-badge-warning">
            {confirmations.length} pending
          </span>
        </div>
      </div>

      <div className="neon-card-body">
        <div className="space-y-3">
          {confirmations.map((confirmation) => (
            <div
              key={confirmation.assignment_id}
              className={`neon-list-item ${
                isOverdue(confirmation.due_at) ? "border-l-4 border-red-500" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {confirmation.item_type === "document" ? (
                    <FiFileText className="text-primary-neon" size={20} />
                  ) : (
                    <FiBook className="text-blue-400" size={20} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-white">
                        {confirmation.item_title}
                      </h4>
                      {confirmation.reference_code && (
                        <p className="text-xs text-gray-400">
                          Ref: {confirmation.reference_code}
                        </p>
                      )}
                    </div>
                    {isOverdue(confirmation.due_at) && (
                      <span className="neon-badge-danger text-xs whitespace-nowrap">
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-400 space-y-1">
                    <p>
                      Assigned: {new Date(confirmation.assigned_at).toLocaleDateString()}
                    </p>
                    {confirmation.due_at && (
                      <p className={isOverdue(confirmation.due_at) ? "text-red-400" : ""}>
                        Due: {new Date(confirmation.due_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    {confirmation.document_url && (
                      <a
                        href={confirmation.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neon-link text-xs"
                      >
                        View Document
                      </a>
                    )}
                    <TextIconButton
                      variant="submit"
                      icon={<FiCheck />}
                      label="Confirm"
                      onClick={() =>
                        onConfirmClick?.(confirmation.assignment_id)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmations.some((c) => isOverdue(c.due_at)) && (
        <div className="neon-card-footer">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <FiAlertCircle />
            <span>You have overdue confirmations that require immediate attention</span>
          </div>
        </div>
      )}
    </div>
  );
}
