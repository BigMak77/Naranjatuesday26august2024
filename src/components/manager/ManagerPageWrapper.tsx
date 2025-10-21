"use client";

import React from "react";
import { useManagerContext } from "@/context/ManagerContext";
import MyTeamView from "@/components/manager/MyTeamView";
import MyTeamTraining from "@/components/training/MyTeamTraining";
import MyTeamComplianceMatrix from "@/components/manager/MyTeamComplianceMatrix";
import MyTeamIssues from "@/components/manager/MyTeamIssues";
import UserView from "@/components/userview/UserView";

type ManagerView = "My Team" | "My Team Training" | "My Team Tasks" | "My Team Issues" | "My Team Audits" | "My Team Compliance" | "User Dashboard";

export default function ManagerPageWrapper() {
  const { currentView } = useManagerContext();

  const renderCurrentView = () => {
    switch (currentView) {
      case "My Team":
        return <MyTeamView />;
      case "My Team Training":
        return <MyTeamTraining />;
      case "My Team Tasks":
        return (
          <div className="neon-card neon-form-padding">
            <h2 className="neon-heading">My Team Tasks</h2>
            <p style={{ color: "var(--text)" }}>
              Team task management - Coming soon.
            </p>
          </div>
        );
      case "My Team Issues":
        return <MyTeamIssues />;
      case "My Team Audits":
        return (
          <div className="neon-card neon-form-padding">
            <h2 className="neon-heading">My Team Audits</h2>
            <p style={{ color: "var(--text)" }}>
              Team audit management and compliance tracking - Coming soon.
            </p>
          </div>
        );
      case "My Team Compliance":
        return <MyTeamComplianceMatrix />;
      case "User Dashboard":
        return <UserView />;
      default:
        return <MyTeamView />;
    }
  };

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="global-content">
          <h1 style={{ fontSize: "2rem", fontWeight: "600", color: "var(--neon)", marginBottom: "1.5rem" }}>
            Manager Dashboard
          </h1>
          
          {/* Current view indicator */}
          <div style={{ marginBottom: "1rem", color: "var(--text)" }}>
            Current View: <span style={{ color: "var(--neon)", fontWeight: "600" }}>{currentView}</span>
          </div>
          
          {/* Render the selected view */}
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}
