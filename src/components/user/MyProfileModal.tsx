import React from "react";
import MyProfile from "@/components/user/MyProfile";

export default function MyProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="neon-modal-overlay">
      <div className="neon-modal-content">
        <button className="neon-btn-square neon-btn-cancel neon-modal-close" onClick={onClose}>
          &times;
        </button>
        <MyProfile />
      </div>
    </div>
  );
}
