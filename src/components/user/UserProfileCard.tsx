"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { FiUser, FiPhone, FiMail, FiShield, FiBell, FiLogIn, FiClock } from "react-icons/fi";

interface UserProfileCardProps {
  authId: string;
}
type Access = "Admin" | "Manager" | "User";
type UserRow = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  access_level: Access | null;
};

export default function UserProfileCard({ authId }: UserProfileCardProps) {
  const [user, setUser] = useState<UserRow | null>(null);
  const [shift, setShift] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Fetch user
        const { data, error } = await supabase
          .from("users")
          .select("first_name, last_name, phone, email, access_level")
          .eq("auth_id", authId)
          .maybeSingle();

        if (!isMounted) return;
        if (error) throw error;
        setUser(data ?? null);

        // Fetch assigned shift
        const { data: shiftData, error: shiftError } = await supabase
          .from("user_shifts")
          .select("shift_id")
          .eq("auth_id", authId)
          .maybeSingle();

        if (!isMounted) return;
        if (shiftError) setShift(null);
        else setShift(shiftData?.shift_id ?? null);
      } catch (e: any) {
        if (!isMounted) return;
        setErr(e?.message ?? "Failed to load profile.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [authId]);

  // Styles are inline to guarantee no bleed from globals
  const rootStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    margin: 0,
    padding: 0,
    border: 0,
    display: "flex",
    alignItems: "center",
    color: "inherit",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    flexWrap: "wrap",
    width: "100%",
  };

  const pairStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginLeft: "auto",
  };

  if (loading) {
    return (
      <div className="profile-card" style={rootStyle} aria-live="polite">
        <p style={{ margin: 0 }}>Loading profile…</p>
      </div>
    );
  }

  if (err || !user) {
    return (
      <div className="profile-card" style={rootStyle} aria-live="polite">
        <p style={{ margin: 0 }}>{err ? `Error: ${err}` : "User not found."}</p>
        <div className="actions" style={actionsStyle}>
          <Link href="/login" className="neon-btn neon-btn-square" aria-label="Log in">
            <FiLogIn className="neon-icon" />
          </Link>
        </div>
      </div>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";
  const phone = user.phone || "—";
  const email = user.email || "—";
  const level = (user.access_level as Access) || "User";

  const dashHref =
    level === "Admin"
      ? "/admin/dashboard"
      : level === "Manager"
      ? "/manager/dashboard"
      : "/user/dashboard";

  return (
    <div className="profile-card" style={rootStyle}>
      <div className="row" style={rowStyle}>
        <span className="pair" style={pairStyle}>
          <FiUser className="neon-icon" />
          <span className="label" style={{ fontWeight: 700, color: "var(--neon)" }}>
            Name:
          </span>{" "}
          {fullName}
        </span>

        <span className="pair" style={pairStyle}>
          <FiPhone className="neon-icon" />
          <span className="label" style={{ fontWeight: 700, color: "var(--neon)" }}>
            Phone:
          </span>{" "}
          {phone}
        </span>

        <span className="pair" style={pairStyle}>
          <FiMail className="neon-icon" />
          <span className="label" style={{ fontWeight: 700, color: "var(--neon)" }}>
            Email:
          </span>{" "}
          {email}
        </span>

        <span className="pair" style={pairStyle}>
          <FiShield className="neon-icon" />
          <span className="label" style={{ fontWeight: 700, color: "var(--neon)" }}>
            Access Level:
          </span>{" "}
          {level}
        </span>

        <span className="pair" style={pairStyle}>
          <FiClock className="neon-icon" />
          <span className="label" style={{ fontWeight: 700, color: "var(--neon)" }}>
            Shift:
          </span>{" "}
          {shift || "—"}
        </span>

        <div className="actions" style={actionsStyle}>
          <Link
            href="/turkus/issues/add"
            className="neon-btn neon-btn-square"
            aria-label="Raise an Issue"
          >
            <FiBell className="neon-icon" />
          </Link>

          <Link
            href={dashHref}
            className="neon-btn neon-btn-square"
            aria-label="Return to dashboard"
          >
            <FiUser className="neon-icon" />
          </Link>
        </div>
      </div>
    </div>
  );
}
