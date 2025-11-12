"use client";
import React from "react";
import { FiMail, FiHeart, FiShield } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { usePermissions } from "@/lib/usePermissions";
import { useUser } from "@/context/UserContext";

export default function UserToolbar() {
  const { isFirstAider, isSafetyRep, canAddFirstAidReport, canAddRiskAssessment } = usePermissions();
  const { user } = useUser();

  const handleContactAdmin = () => {
    console.log('Contact Admin clicked');
    // TODO: Implement contact admin functionality
    alert('Contact Admin feature - Coming soon!');
  };

  return (
    <section className="section-toolbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* First Aider Button */}
        {canAddFirstAidReport && (
          <NeonIconButton
            icon={<FiHeart />}
            variant="add"
            title="Add First Aid Report"
            onClick={() => (window.location.href = "/health-safety/firstaid")}
          />
        )}

        {/* Safety Rep Button */}
        {canAddRiskAssessment && (
          <NeonIconButton
            icon={<FiShield />}
            variant="add"
            title="Add Risk Assessment"
            onClick={() => (window.location.href = "/health-safety")}
          />
        )}

        {/* Contact Admin Button */}
        <NeonIconButton
          icon={<FiMail />}
          variant="send"
          title="Contact Admin"
          onClick={handleContactAdmin}
        />
      </div>

      <span style={{ minWidth: "200px", whiteSpace: "nowrap" }}>
        {user?.first_name ? `${user.first_name}, Access level: User` : "User Toolbar"}
      </span>
    </section>
  );
}
