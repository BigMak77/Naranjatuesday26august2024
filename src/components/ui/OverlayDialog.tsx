"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type OverlayDialogProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabelledby?: string;
  zIndexOverlay?: number; // defaults safe
  zIndexContent?: number; // defaults safe
  closeOnOutsideClick?: boolean;
};

export default function OverlayDialog({
  open,
  onClose,
  children,
  ariaLabelledby,
  zIndexOverlay = 60000,
  zIndexContent = 60001,
  closeOnOutsideClick = true,
}: OverlayDialogProps) {
  const mountRef = useRef<HTMLElement | null>(null);

  // create a portal mount once
  if (!mountRef.current && typeof document !== "undefined") {
    const el = document.createElement("div");
    el.setAttribute("data-portal", "overlay-dialog");
    mountRef.current = el;
  }

  // mount/unmount the portal element
  useEffect(() => {
    if (!mountRef.current) return;
    document.body.appendChild(mountRef.current);
    return () => {
      if (mountRef.current?.parentNode) {
        mountRef.current.parentNode.removeChild(mountRef.current);
      }
    };
  }, []);

  // lock scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open || !mountRef.current) return null;

  return createPortal(
    <div
      className="ui-dialog-overlay"
      style={{ zIndex: zIndexOverlay }}
      onClick={(e) => {
        if (!closeOnOutsideClick) return;
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden={false}
    >
      <div
        className="ui-dialog-content neon-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        style={{ zIndex: zIndexContent, width: 900 }}
      >
        {children}
      </div>
    </div>,
    mountRef.current,
  );
}
