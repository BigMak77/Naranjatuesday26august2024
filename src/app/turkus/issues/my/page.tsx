"use client";

import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function MyIssuesPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin", "H&S Admin", "Dept. Manager", "Manager"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to view department issues."
    >
      <div className="centered-content">
        <div className="my-issues-container">
          {/* MyDepartmentIssues removed - no longer used */}
          {/* You can add a replacement component or leave blank */}
        </div>
      </div>
    </AccessControlWrapper>
  );
}
