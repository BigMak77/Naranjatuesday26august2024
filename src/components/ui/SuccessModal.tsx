import React from "react";
import Modal from "@/components/modal";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export default function SuccessModal({ open, onClose, message = "Success!" }: SuccessModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="neon-form neon-success-modal"
        style={{
          textAlign: "center",
          padding: "2rem 2.5rem",
          borderRadius: 16,
          color: "#39ff14",
          fontWeight: 700,
          fontSize: "1.25rem",
          boxShadow: "0 0 16px #39ff14",
          background: "#012b2b"
        }}
      >
        <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "1rem" }}>✅</span>
        {message}
      </div>
    </Modal>
  );
}
