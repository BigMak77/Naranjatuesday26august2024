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
import NeonIconButton from "@/components/ui/NeonIconButton";
import HealthSafetyPolicyManager from "@/components/turkus/HealthSafetyPolicyManager";

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
        <main className="global-content">
          <div className="neon-tab-bar">
            <NeonIconButton
              variant={activeTab === "assessments" ? "view" : "info"}
              icon={<FiClipboard />}
              title="Risk Assessments"
              onClick={() => setActiveTab("assessments")}
            />
            <NeonIconButton
              variant={activeTab === "incidents" ? "view" : "info"}
              icon={<FiAlertCircle />}
              title="Incidents"
              onClick={() => setActiveTab("incidents")}
            />
            <NeonIconButton
              variant={activeTab === "policies" ? "view" : "info"}
              icon={<FiFileText />}
              title="Policies"
              onClick={() => setActiveTab("policies")}
            />
            <NeonIconButton
              variant={activeTab === "firstaid" ? "view" : "info"}
              icon={<FiHeart />}
              title="First Aid"
              onClick={() => setActiveTab("firstaid")}
            />
          </div>

          {activeTab === "assessments" && <RiskAssessmentManager />}

          {activeTab === "incidents" && (
            <NeonPanel>
              <NeonForm
                title="Incident Report Form"
                onSubmit={(e) => {
                  e.preventDefault(); /* handle incident submit */
                }}
              >
                <input className="neon-input" placeholder="Incident Title" />
                <textarea
                  className="neon-input"
                  placeholder="Description"
                  rows={3}
                />
              </NeonForm>
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
