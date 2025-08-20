import React from "react";
import MyProfile from "@/components/user/MyProfile";

export default function MyProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(255,165,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal-content" style={{ background: "linear-gradient(135deg,rgb(19, 98, 101) 0%,rgb(10, 121, 125) 100%)", borderRadius: 16, boxShadow: "0 8px 32px rgba(255,165,0,0.18)", padding: 32, minWidth: 340, maxWidth: 480, width: "100%", position: "relative", border: "2px solidrgb(255, 255, 255)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 24, color: "#fffff", cursor: "pointer" }}>&times;</button>
        <MyProfile />
      </div>
    </div>
  );
}
