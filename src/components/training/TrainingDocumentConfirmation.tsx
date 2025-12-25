"use client";

import React, { useState } from "react";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiCheckCircle, FiFileText, FiX } from "react-icons/fi";

export interface DocumentConfirmationData {
  assignmentId: string;
  authId: string;
  documentId: string;
  documentTitle: string;
  userName: string;
}

interface TrainingDocumentConfirmationProps {
  data: DocumentConfirmationData | null;
  onClose: () => void;
  onConfirm: (assignmentId: string, authId: string, documentId: string) => Promise<void>;
}

export default function TrainingDocumentConfirmation({
  data,
  onClose,
  onConfirm,
}: TrainingDocumentConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const handleConfirm = async () => {
    if (!data || !hasAcknowledged) return;

    setIsConfirming(true);
    try {
      await onConfirm(data.assignmentId, data.authId, data.documentId);
      handleClose();
    } catch (error) {
      console.error("Error confirming document:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setHasAcknowledged(false);
    onClose();
  };

  if (!data) return null;

  return (
    <OverlayDialog
      open={true}
      onClose={handleClose}
      width={600}
      showCloseButton={false}
      closeOnOutsideClick={false}
      closeOnEscape={true}
    >
      <div style={{ padding: "32px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "2px solid var(--neon)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--neon)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiFileText size={24} style={{ color: "var(--bg-dark)" }} />
          </div>
          <div>
            <h2
              className="neon-heading"
              style={{ margin: 0, fontSize: "1.5rem" }}
            >
              Document Confirmation
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "0.9rem",
                color: "var(--text-white)",
                opacity: 0.7,
              }}
            >
              {data.userName}
            </p>
          </div>
        </div>

        {/* Document Information */}
        <div
          style={{
            background: "rgba(64, 224, 208, 0.1)",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "24px",
            border: "1px solid rgba(64, 224, 208, 0.3)",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                fontSize: "0.85rem",
                color: "var(--text-white)",
                opacity: 0.7,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Document
            </label>
            <div
              style={{
                fontSize: "1.1rem",
                color: "var(--neon)",
                fontWeight: "bold",
                marginTop: "4px",
              }}
            >
              {data.documentTitle}
            </div>
          </div>
        </div>

        {/* Confirmation Text */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-white)",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            By checking the box below, you confirm that you have read,
            understood, and acknowledge the contents of this document. This
            confirmation will be recorded in your training records.
          </p>
        </div>

        {/* Acknowledgement Checkbox */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "32px",
            padding: "16px",
            background: hasAcknowledged
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
            border: hasAcknowledged
              ? "2px solid var(--text-success)"
              : "2px solid rgba(255, 255, 255, 0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onClick={() => setHasAcknowledged(!hasAcknowledged)}
        >
          <input
            type="checkbox"
            id="acknowledge-checkbox"
            checked={hasAcknowledged}
            onChange={(e) => setHasAcknowledged(e.target.checked)}
            style={{
              width: "20px",
              height: "20px",
              cursor: "pointer",
              marginTop: "2px",
            }}
          />
          <label
            htmlFor="acknowledge-checkbox"
            style={{
              fontSize: "0.95rem",
              color: "var(--text-white)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            I confirm that I have read and understood this document
          </label>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <TextIconButton
            variant="cancel"
            label="Cancel"
            icon={<FiX />}
            onClick={handleClose}
            disabled={isConfirming}
          />
          <TextIconButton
            variant="save"
            label={isConfirming ? "Confirming..." : "Confirm Reading"}
            icon={<FiCheckCircle />}
            onClick={handleConfirm}
            disabled={!hasAcknowledged || isConfirming}
          />
        </div>

        {/* Info Notice */}
        {!hasAcknowledged && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(251, 191, 36, 0.1)",
              borderRadius: "6px",
              border: "1px solid rgba(251, 191, 36, 0.3)",
            }}
          >
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-warning)",
                margin: 0,
                textAlign: "center",
              }}
            >
              Please acknowledge that you have read the document to continue
            </p>
          </div>
        )}
      </div>
    </OverlayDialog>
  );
}
