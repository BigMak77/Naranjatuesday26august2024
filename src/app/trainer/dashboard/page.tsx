"use client";
import TrainingDashboard from "@/components/training/TrainingDashboard";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function TrainerDashboardPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "Trainer"]}
      redirectOnNoAccess={true}
      noAccessMessage="Trainer access required. Redirecting to your dashboard..."
    >
      <TrainingDashboard />
    </AccessControlWrapper>
  );
}
