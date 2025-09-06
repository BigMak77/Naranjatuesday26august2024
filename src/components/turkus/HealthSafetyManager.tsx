"use client";

import React, { useState, useEffect } from "react";
// Removed unused NeonFeatureCard import
import RiskAssessmentManager from "@/components/turkus/RiskAssessmentManager";
import {
  FiClipboard,
  FiAlertCircle,
  FiFileText,
  FiHeart,
} from "react-icons/fi";
import NeonForm from "@/components/NeonForm";
import NeonPanel from "@/components/NeonPanel";
import FolderTabs from "@/components/FolderTabs";
import HealthSafetyPolicyManager from "@/components/turkus/HealthSafetyPolicyManager";
// If the file is named 'NeonIconButton.tsx' and located in 'src/components', use:
import NeonIconButton from "@/components/ui/NeonIconButton";
// Or, if using absolute imports, ensure the file exists at 'src/components/NeonIconButton.tsx'
import IncidentFormMinimal from "@/components/safety/IncidentFormMinimal";
import type { MinimalIncidentForm } from "@/components/safety/IncidentFormMinimal";
import MainHeader from "@/components/ui/MainHeader";

export default function HealthSafetyManager() {
  const [activeTab, setActiveTab] = useState<
    "assessments" | "incidents" | "policies" | "firstaid"
  >("assessments");

  useEffect(() => {
    // Simulate fetching policies (replace with supabase or API call)
  }, []);

  return (
    <div className="after-hero">
      <div className="global-content">
        <MainHeader
          title="Health & Safety Manager"
          subtitle="Manage risk assessments, incidents, policies, and first aid records"
        />
        <main className="global-content">
          <div style={{ marginBottom: 24 }}>
            <FolderTabs
              tabs={[
                { key: "assessments", label: "Risk Assessments", icon: <FiClipboard /> },
                { key: "incidents", label: "Incidents", icon: <FiAlertCircle /> },
                { key: "policies", label: "Policies", icon: <FiFileText /> },
                { key: "firstaid", label: "First Aid", icon: <FiHeart /> },
              ]}
              activeTab={activeTab}
              onChange={tabKey => setActiveTab(tabKey as typeof activeTab)}
            />
          </div>

          {activeTab === "assessments" && <RiskAssessmentManager />}

          {activeTab === "incidents" && (
            <NeonPanel>
              {/* Render the minimal incident form from incidents/add */}
              <IncidentFormMinimal
                onSubmit={async (data: MinimalIncidentForm) => {
                  // TODO: handle incident submission (e.g., save to supabase)
                  // You can add your logic here or pass a handler from parent
                }}
              />
            </NeonPanel>
          )}

          {activeTab === "policies" && <HealthSafetyPolicyManager />}

          {activeTab === "firstaid" && (
            <NeonPanel>
              <h2 className="neon-form-title">
                <NeonIconButton
                  variant="view"
                  icon={<FiHeart />}
                  title="First Aid"
                  onClick={() => (window.location.href = "/firstaid/")}
                />
              </h2>
            </NeonPanel>
          )}
        </main>
      </div>
    </div>
  );
}
