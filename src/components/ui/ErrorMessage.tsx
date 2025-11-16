"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  /** set true to render without portals to rule out portal/z-index issues */
  inlineFallback?: boolean;
  /** raise if something on the page has a high z-index */
  zIndexBase?: number; // default 999999
};

export default function ErrorMessage({
  open,
  onClose,
  title = "Error",
  message = "An error occurred",
  inlineFallback = false,
  zIndexBase = 999999,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // client-only mount + portal host
  useEffect(() => {
    setMounted(true);
    if (inlineFallback) return; // skip portal in inline mode
    let el = document.querySelector<HTMLElement>('[data-portal="error-modal"]');
    if (!el) {
      el = document.createElement("div");
      el.setAttribute("data-portal", "error-modal");
      document.body.appendChild(el);
    }
    setHost(el);
  }, [inlineFallback]);

  // lock scroll while open
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, mounted]);

  // focus panel when opened
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  // Log state changes for debugging
  useEffect(() => {
    console.log("[ErrorMessage] Open state:", open);
  }, [open]);

  if (!mounted || !open) return null;

  const overlay = (
    <div
      role="presentation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndexBase,
      }}
      // No onClick handler here - modal cannot be closed by clicking outside
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-title"
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()} // Prevent any click-through
        style={{
          backgroundColor: "#053639",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          padding: "2rem",
          width: "100%",
          maxWidth: "32rem",
          margin: "0 1rem",
          outline: "none",
          border: "2px solid #ff4444",
        }}
      >
        <h2
          id="error-title"
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#ff4444",
            marginBottom: "1rem",
            marginTop: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "2rem" }}>⚠️</span>
          {title}
        </h2>
        <p
          style={{
            color: "#fff",
            lineHeight: 1.625,
            margin: "0 0 1.5rem 0",
            fontSize: "1rem",
          }}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          className="neon-btn neon-btn-primary"
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
          }}
          autoFocus
        >
          OK
        </button>
      </div>
    </div>
  );

  // Inline mode (no portal) to bypass SSR/portal/z-index issues
  if (inlineFallback) return overlay;

  // Portal mode
  if (!host) return null;
  return createPortal(overlay, host);
}
