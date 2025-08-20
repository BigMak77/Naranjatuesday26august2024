"use client";

import React from "react";
import { FiArchive, FiX } from "react-icons/fi";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  // Optional icons & styles
  iconConfirm?: React.ReactNode;
  iconCancel?: React.ReactNode;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
  iconConfirm = <FiArchive />,
  iconCancel = <FiX />,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => !loading && onCancel()}>
      <DialogContent aria-labelledby="confirm-title">
        <h2 id="confirm-title" className="neon-form-title" style={{ marginBottom: "1.25rem" }}>
          {title}
        </h2>
        {description && <div className="mb-4">{description}</div>}
        <div
          className="neon-panel-actions"
          style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}
        >
          <button className="btn-archive" onClick={onConfirm} disabled={loading} autoFocus>
            {iconConfirm} {loading ? "Working…" : confirmLabel}
          </button>
          <button className="neon-btn neon-btn-danger" onClick={onCancel} disabled={loading}>
            {iconCancel} {cancelLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
