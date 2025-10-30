"use client";

import React, { useEffect, useRef } from "react";
import { CustomTooltip } from "./ui/CustomTooltip";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>; // optional: where to focus first
  children: React.ReactNode;
};

export default function Modal({
  open,
  title,
  onClose,
  initialFocusRef,
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  // Save/restore focus, set initial focus
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;

    const target =
      initialFocusRef?.current ||
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]") ||
      dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ||
      null;

    target?.focus({ preventScroll: true });

    return () => {
      lastFocusedRef.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      // Basic focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement as HTMLElement;
        if (e.shiftKey && current === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="ui-dialog-overlay"
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose(); // click outside closes
        }}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "app-modal-title" : undefined}
        className="ui-dialog-content neon-dialog"
        ref={dialogRef}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          {title ? (
            <h2 id="app-modal-title" className="neon-form-title">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <CustomTooltip text="Close modal">
            <button
              className="neon-btn neon-btn-close"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </CustomTooltip>
        </div>
        <div>{children}</div>
      </div>
    </>
  );
}
