// ../ui/SuccessModal.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoCloseMs?: number;
  /** set true to render without portals to rule out portal/z-index issues */
  inlineFallback?: boolean;
  /** raise if something on the page has a high z-index */
  zIndexBase?: number; // default 999999
};

export default function SuccessModal({
  open,
  onClose,
  title = "Success",
  message = "Thank you, your changes have been added to NARANJA",
  autoCloseMs = 3000, // 3 seconds default
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
    let el = document.querySelector<HTMLElement>('[data-portal="success-modal"]');
    if (!el) {
      el = document.createElement("div");
      el.setAttribute("data-portal", "success-modal");
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

  // auto close
  useEffect(() => {
    if (!open || !autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs, onClose]);

  // focus panel when opened
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!mounted || !open) return null;

  const overlay = (
    <div
      role="presentation"
      onMouseDown={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndexBase,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        tabIndex={-1}
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#053639",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          padding: "2rem",
          width: "100%",
          maxWidth: "28rem",
          margin: "0 1rem",
          outline: "none",
          border: "1px solid #fa7a20",
        }}
      >
        <h2
          id="success-title"
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#fff",
            marginBottom: "0.75rem",
            marginTop: 0,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            color: "#fff",
            lineHeight: 1.625,
            margin: 0,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );

  // Inline mode (no portal) to bypass SSR/portal/z-index issues
  if (inlineFallback) return overlay;

  // Portal mode
  if (!host) return null;
  return createPortal(overlay, host);
}
