"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type OverlayDialogProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabelledby?: string;
  zIndexOverlay?: number; // defaults safe
  zIndexContent?: number; // defaults safe
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean; // disable ESC key closing
  width?: number; // custom width in pixels
  transparentOverlay?: boolean; // for login page background visibility
  showCloseButton?: boolean; // show circular X button in top-right corner
  compactHeight?: boolean; // use 80vh max-height instead of 90vh
};

export default function OverlayDialog({
  open,
  onClose,
  children,
  ariaLabelledby,
  zIndexOverlay = 60000,
  zIndexContent = 60001,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  width = 900,
  transparentOverlay = false,
  showCloseButton = false,
  compactHeight = false,
}: OverlayDialogProps) {
  const mountRef = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // mount/unmount the portal element
  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-portal", "overlay-dialog");
    mountRef.current = el;
    document.body.appendChild(el);
    setIsMounted(true);

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
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, closeOnEscape, onClose]);

  if (!open || !isMounted || !mountRef.current) return null;

  return createPortal(
    <div
      className={`ui-dialog-overlay ${transparentOverlay ? 'transparent-overlay' : ''}`}
      style={{
        zIndex: zIndexOverlay,
      }}
      onClick={(e) => {
        console.log('Overlay clicked. closeOnOutsideClick:', closeOnOutsideClick, 'target matches:', e.target === e.currentTarget);
        if (!closeOnOutsideClick) return;
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden={false}
    >
      <div
        className={`ui-dialog-content neon-dialog${compactHeight ? ' compact-height' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        style={{
          zIndex: zIndexContent,
          width: width,
          maxWidth: '95vw',
          position: 'relative'
        }}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="ui-dialog-close-btn"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ui-dialog-close-icon"
            >
              <path
                d="M2 2L10 10M10 2L2 10"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>,
    mountRef.current,
  );
}
