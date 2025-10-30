"use client";
import UserView from "@/components/userview/UserView";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import ContentHeader from "@/components/ui/ContentHeader";

export default function UsersDashboardPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin", "H&S Admin", "Dept. Manager", "Manager", "Trainer", "User"]}
      redirectOnNoAccess={true}
      noAccessMessage="You must be logged in to access this page. Redirecting to login..."
    >
      <ContentHeader
        title="My Dashboard"
        description="View your tasks, issues, and training progress"
      />
      <UserView />
    </AccessControlWrapper>
  );
}
