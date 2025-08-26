"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiShield,
  FiBell,
  FiLogIn,
  FiClock,
} from "react-icons/fi";

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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [shift, setShift] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, phone, email, access_level")
        .eq("auth_id", authId)
        .maybeSingle();

      if (!isMounted) return;
      if (error) setErr(error.message);
      setUser(data ?? null);
      setLoading(false);

      // Fetch assigned shift
      const { data: shiftData, error: shiftError } = await supabase
        .from("user_shifts")
        .select("shift_id")
        .eq("auth_id", authId)
        .maybeSingle();
      if (shiftError) setShift(null);
      else setShift(shiftData?.shift_id ?? null);
    })();
    return () => {
      isMounted = false;
    };
  }, [authId]);

  if (loading) {
    return (
      <div className="user-profile-card">
        <p>Loading profile…</p>
      </div>
    );
  }

  if (err || !user) {
    return (
      <div className="user-profile-card">
        <p>{err ? `Error: ${err}` : "User not found."}</p>
        <div className="actions">
          <Link href="/login" className="neon-btn neon-btn-square" aria-label="Log in">
            <FiLogIn className="neon-icon" />
          </Link>
        </div>
      </div>
    );
  }

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";
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
    <div className="user-profile-card">
      <div
        className="row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          flexWrap: "wrap",
        }}
      >
        <span
          className="pair"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <FiUser className="neon-icon" />
          <span className="label">Name:</span> {fullName}
        </span>
        <span
          className="pair"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <FiPhone className="neon-icon" />
          <span className="label">Phone:</span> {phone}
        </span>
        <span
          className="pair"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <FiMail className="neon-icon" />
          <span className="label">Email:</span> {email}
        </span>
        <span
          className="pair"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <FiShield className="neon-icon" />
          <span className="label">Access Level:</span> {level}
        </span>
        <span
          className="pair"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <FiClock className="neon-icon" />
          <span className="label">Shift:</span> {shift || "—"}
        </span>
        <div
          className="actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginLeft: "auto",
          }}
        >
          {/* Raise an Issue */}
          <Link
            href="/turkus/issues/add"
            className="neon-btn neon-btn-square"
            aria-label="Raise an Issue"
          >
            <FiBell className="neon-icon" />
          </Link>

          {/* Dashboard */}
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
