"use client";
import HrAdminView from "@/components/userview/HrAdminView";
import MainHeader from "@/components/ui/MainHeader";
import RequireAccess from "@/components/RequireAccess";

export default function HrDashboardPage() {
  return (
    <RequireAccess allowedRoles={["HR", "Admin"]}>
      <MainHeader
        title="HR Admin Dashboard"
        subtitle="Manage people, users, roles, structures, and permissions"
      />
      <main className="after-hero global-content">
        <HrAdminView />
      </main>
    </RequireAccess>
  );
}
