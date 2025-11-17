"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiCheck, FiClock, FiAlertCircle } from "react-icons/fi";

export interface ConfirmationRecord {
  id: string;
  document_id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  signature: string | null;
  confirmed_at: string;
}

interface DocumentConfirmationStatusProps {
  documentId: string;
  userId: string;
  showDetails?: boolean;
}

export default function DocumentConfirmationStatus({
  documentId,
  userId,
  showDetails = false,
}: DocumentConfirmationStatusProps) {
  const [confirmation, setConfirmation] = useState<ConfirmationRecord | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfirmation();
  }, [documentId, userId]);

  const fetchConfirmation = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("document_confirmations")
        .select("*")
        .eq("document_id", documentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setConfirmation(data);
    } catch (err) {
      console.error("Error fetching confirmation:", err);
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <FiClock className="animate-spin" />
        <span className="text-sm">Checking confirmation status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <FiAlertCircle />
        <span className="text-sm">Error loading status</span>
      </div>
    );
  }

  if (!confirmation) {
    return (
      <div className="flex items-center gap-2 text-yellow-400">
        <FiAlertCircle />
        <span className="text-sm font-medium">Confirmation Required</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-green-400">
        <FiCheck className="text-lg" />
        <span className="text-sm font-medium">Confirmed</span>
      </div>

      {showDetails && (
        <div className="ml-6 space-y-1 text-xs text-gray-400">
          <p>
            Confirmed on:{" "}
            {new Date(confirmation.confirmed_at).toLocaleString()}
          </p>
          {confirmation.signature && (
            <p>Signed by: {confirmation.signature}</p>
          )}
          {confirmation.user_name && (
            <p>User: {confirmation.user_name}</p>
          )}
        </div>
      )}
    </div>
  );
}
