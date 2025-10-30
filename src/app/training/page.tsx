"use client";
import React from "react";
import TrainerRecordingPage from "@/components/userview/TrainerView";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function TrainingPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "Trainer"]}
      redirectOnNoAccess={true}
      noAccessMessage="Trainer access required. Redirecting to your dashboard..."
    >
      <TrainerRecordingPage />
    </AccessControlWrapper>
  );
}
