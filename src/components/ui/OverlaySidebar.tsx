import React from "react";
import { FiFolder } from "react-icons/fi";

export interface OverlaySidebarProps {
  open: boolean;
  onClose: () => void;
  ariaLabelledby?: string;
  width?: number | string;
  children?: React.ReactNode;
}

export const OverlaySidebar: React.FC<OverlaySidebarProps> = ({
  open,
  onClose,
  ariaLabelledby,
  width = 340,
  children,
}) => {
  if (!open) return null;
  return (
    <div
      className="ui-dialog-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647, // Ensure overlay is above everything
        background: "var(--overlay-bg,rgba(1,43,43,0.44))", // Use standard overlay color
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-start",
      }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={ariaLabelledby}
    >
      <aside
        className="overlay-sidebar"
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: "calc(100vh - 100px)",
          marginTop: "100px",
          background: "var(--sidebar-bg, var(--field, #012b2b))", // Use standard sidebar background, fallback to --field
          color: "var(--sidebar-fg, var(--neon, #40e0d0))", // Use standard sidebar foreground if defined
          boxShadow: "2px 0 16px var(--shadow-color,#0002)",
          borderTop: "4px solid #c75c00",
          borderRight: "4px solid #c75c00",
          borderBottom: "4px solid #c75c00",
          borderLeft: "none",
          borderTopRightRadius: "18px",
          borderBottomRightRadius: "18px",
          transition: "transform 0.2s cubic-bezier(.4,0,.2,1)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
        aria-labelledby={ariaLabelledby}
      >
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: 0,
            fontSize: 24,
            cursor: "pointer",
            color: "var(--sidebar-close,#888)", // Use standard close color
          }}
        >
          ×
        </button>
        {/* Removed demo buttons. Only render children here. */}
        {children}
      </aside>
    </div>
  );
};
