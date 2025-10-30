"use client";

import React from "react";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import ContentHeader from "@/components/ui/ContentHeader";

export default function DashboardPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Admin access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Admin Dashboard"
        description="Quick access to people management, roles, and compliance"
      />
    </AccessControlWrapper>
  );
}
