"use client";
import React from "react";
import { FiMail, FiHeart, FiShield } from "react-icons/fi";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
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
      <div className="toolbar-buttons">
        {/* First Aider Button */}
        {canAddFirstAidReport && (
          <CustomTooltip text="Add First Aid Report" placement="bottom">
            <TextIconButton
              icon={<FiHeart />}
              variant="add"
              label="Add First Aid Report"
              onClick={() => (window.location.href = "/health-safety/firstaid")}
            />
          </CustomTooltip>
        )}

        {/* Safety Rep Button */}
        {canAddRiskAssessment && (
          <CustomTooltip text="Add Risk Assessment" placement="bottom">
            <TextIconButton
              icon={<FiShield />}
              variant="add"
              label="Add Risk Assessment"
              onClick={() => (window.location.href = "/health-safety")}
            />
          </CustomTooltip>
        )}

        {/* Contact Admin Button */}
        <CustomTooltip text="Contact Admin" placement="bottom">
          <TextIconButton
            icon={<FiMail />}
            variant="send"
            label="Contact Admin"
            onClick={handleContactAdmin}
          />
        </CustomTooltip>
      </div>

      <span className="toolbar-user-info">
        {user?.first_name ? `${user.first_name}, Access level: User` : "User Toolbar"}
      </span>
    </section>
  );
}
