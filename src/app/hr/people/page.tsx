"use client";

import UserManagementPanel from "@/components/user/UserManagementPanel";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function PeopleManagementPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to access people management."
    >
      <ContentHeader
        title="People Management"
        description="Manage employees and user accounts"
      />
      <UserManagementPanel />
    </AccessControlWrapper>
  );
}
