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
      onMouseDown={onClose} // click outside
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
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
          background: "#073642", // dark teal
          width: "min(520px, 92vw)",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          padding: 24,
          outline: "none",
          border: "3px solid #ff8800", // orange border
          color: "#fff", // white text
        }}
      >
        <h2 id="success-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{title}</h2>
        <p style={{ marginTop: 10, marginBottom: 0, lineHeight: 1.5, color: "#fff" }}>{message}</p>
      </div>
    </div>
  );

  // Inline mode (no portal) to bypass SSR/portal/z-index issues
  if (inlineFallback) return overlay;

  // Portal mode
  if (!host) return null;
  return createPortal(overlay, host);
}
