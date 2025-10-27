"use client";
import HrAdminView from "@/components/userview/HrAdminView";
import MainHeader from "@/components/ui/MainHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function HrDashboardPage() {
  return (
    <AccessControlWrapper 
      requiredRoles={["HR Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="HR access required. Redirecting to your dashboard..."
    >
      <MainHeader
        title="HR Admin Dashboard"
        subtitle="Manage people, users, roles, structures, and permissions"
      />
      <main className="after-hero global-content">
        <HrAdminView />
      </main>
    </AccessControlWrapper>
  );
}
