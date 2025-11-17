"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiAlertCircle } from "react-icons/fi";

interface ConfirmationBadgeProps {
  userId: string;
  showZero?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function ConfirmationBadge({
  userId,
  showZero = false,
  className = "",
  onClick,
}: ConfirmationBadgeProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCount();

    // Set up real-time subscription for changes
    const subscription = supabase
      .channel("pending_confirmations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_assignments",
          filter: `auth_id=eq.${userId}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchCount = async () => {
    try {
      const { data, error } = await supabase.rpc(
        "get_pending_confirmations_count",
        { p_auth_id: userId }
      );

      if (error) throw error;
      setCount(data || 0);
    } catch (err) {
      console.error("Error fetching confirmation count:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      } ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <FiAlertCircle
        className={count > 0 ? "text-yellow-400" : "text-gray-400"}
        size={16}
      />
      <span
        className={`text-sm font-medium ${
          count > 0 ? "text-yellow-400" : "text-gray-400"
        }`}
      >
        {count} {count === 1 ? "confirmation" : "confirmations"} pending
      </span>
      {count > 0 && (
        <span className="neon-badge-warning ml-1">{count}</span>
      )}
    </div>
  );
}
