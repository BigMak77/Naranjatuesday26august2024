// src/components/Sidebar.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiTool, FiX } from "react-icons/fi";

const sidebarLinks = [
  { href: "/admin/utility/shift", label: "Utility", icon: <FiTool /> },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button to open sidebar */}
      <button
        className="neon-btn neon-btn-accent"
        style={{ position: "fixed", top: 24, left: 24, zIndex: 1100 }}
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FiTool />
        </span>
      </button>
      {/* Sidebar overlay */}
      <aside className={`sidebar-overlay${open ? " open" : ""}`}>
        <button
          className="sidebar-close-btn"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiX />
          </span>
        </button>
        <nav>
          {sidebarLinks.map((link) => (
            <Link key={link.href} href={link.href} className="sidebar-link">
              <span
                className="sidebar-icon"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "0.5em",
                }}
              >
                {link.icon}
              </span>
              <span className="sidebar-label">{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
