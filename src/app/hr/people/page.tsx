"use client";

import UserManagementPanel from "@/components/user/UserManagementPanel";
import ContentHeader from "@/components/ui/ContentHeader";

export default function PeopleManagementPage() {
  return (
    <>
      <ContentHeader
        title="People Management"
        description="Manage employees and user accounts"
      />
      <UserManagementPanel />
    </>
  );
}
