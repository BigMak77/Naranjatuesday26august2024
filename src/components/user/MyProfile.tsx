import React from "react";
import { useUser } from "@/lib/useUser";
import NeonPanel from "@/components/NeonPanel";

export default function MyProfile() {
  const { user } = useUser();
  if (!user) return <NeonPanel className="my-profile-panel">Loading...</NeonPanel>;

  return (
    <NeonPanel className="my-profile-panel">
      <div className="my-profile-header">
        <div className="my-profile-avatar-block">
          {/* Avatar placeholder */}
          <div
            className="my-profile-avatar"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              border: "3px solid #FA7A20",
              background: "#222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FA7A20",
              fontSize: 48,
            }}
          >
            <span>PNG</span>
          </div>
        </div>
      </div>
      <div className="my-profile-info">
        <h2 className="my-profile-name">{user.first_name} {user.last_name}</h2>
        <div className="my-profile-meta">
          <div><strong>Auth ID:</strong> {user.auth_id}</div>
          <div><strong>Access Level:</strong> {user.access_level}</div>
          <div><strong>Department ID:</strong> {user.department_id}</div>
        </div>
      </div>
    </NeonPanel>
  );
}
