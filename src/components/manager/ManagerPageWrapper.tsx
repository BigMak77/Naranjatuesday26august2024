"use client";

import React from "react";
import { useManagerContext } from "@/context/ManagerContext";
import { useUser } from "@/lib/useUser";
import MyTeamView from "@/components/manager/MyTeamView";
import MyTeamTraining from "@/components/training/MyTeamTraining";
import TrainingMatrix from "@/components/training/TrainingMatrix";
import MyTeamComplianceMatrix from "@/components/manager/MyTeamComplianceMatrix";
import MyTeamIssues from "@/components/manager/MyTeamIssues";
import UserView from "@/components/userview/UserView";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import ContentHeader from "@/components/ui/ContentHeader";

type ManagerView = "My Team" | "My Team Training" | "Training Matrix" | "My Team Tasks" | "My Team Issues" | "My Team Audits" | "My Team Compliance" | "User Dashboard";

export default function ManagerPageWrapper() {
  const { currentView } = useManagerContext();
  const { user } = useUser();

  // Get header info based on current view
  const getHeaderInfo = () => {
    switch (currentView) {
      case "My Team":
        return {
          title: "My Team",
          description: "View and manage your team members, assignments, and department structure"
        };
      case "My Team Training":
        return {
          title: "Team Training Assignments",
          description: "View and track training assignments for your team members"
        };
      case "Training Matrix":
        return {
          title: "Training Matrix",
          description: "Comprehensive view of training completion status across your team"
        };
      case "My Team Tasks":
        return {
          title: "Team Tasks",
          description: "Assign and track tasks for your team members"
        };
      case "My Team Issues":
        return {
          title: "Team Issues",
          description: "View and manage issues raised by your team members"
        };
      case "My Team Audits":
        return {
          title: "Team Audits",
          description: "Conduct and review audits for your team"
        };
      case "My Team Compliance":
        return {
          title: "Team Compliance",
          description: "Monitor compliance status and requirements for your team"
        };
      case "User Dashboard":
        return {
          title: "User View",
          description: "View your personal tasks, issues, and training dashboard"
        };
      default:
        return {
          title: "Manager Dashboard",
          description: "Manage and monitor your team's performance, training, and compliance"
        };
    }
  };

  const headerInfo = getHeaderInfo();

  const renderCurrentView = () => {
    switch (currentView) {
      case "My Team":
        return <MyTeamView />;
      case "My Team Training":
        return <MyTeamTraining />;
      case "Training Matrix":
        return <TrainingMatrix filterByDepartmentId={user?.department_id || undefined} />;
      case "My Team Tasks":
        return (
          <div className="neon-card neon-form-padding">
            <h2 className="neon-heading">My Team Tasks</h2>
            <p className="neon-text">
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
            <p className="neon-text">
              Team audit management and compliance tracking - Coming soon.
            </p>
          </div>
        );
      case "My Team Compliance":
        return <MyTeamComplianceMatrix />;
      case "User Dashboard":
        return (
          <AccessControlWrapper
            requiredRoles={["Super Admin", "Admin", "Dept. Manager", "Manager"]}
            hideIfNoAccess={true}
            fallback={
              <div className="neon-error neon-form-padding">
                <h2 className="neon-heading">Access Denied</h2>
                <p>You need Manager or Admin privileges to view the User Dashboard.</p>
              </div>
            }
          >
            <UserView />
          </AccessControlWrapper>
        );
      default:
        return <MyTeamView />;
    }
  };

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="global-content">
          <ContentHeader
            title={headerInfo.title}
            description={headerInfo.description}
          />

          {/* Render the selected view */}
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}
