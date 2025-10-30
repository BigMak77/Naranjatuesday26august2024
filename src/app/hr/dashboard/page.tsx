"use client";
import HrAdminView from "@/components/userview/HrAdminView";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function HrDashboardPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="HR access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="HR Admin Dashboard"
        description="Manage people, users, roles, structures, and permissions"
      />
      <main className="after-hero global-content">
        <HrAdminView />
      </main>
    </AccessControlWrapper>
  );
}
