import AccessControlWrapper from "@/components/AccessControlWrapper";
import DepartmentIssuesWidget from "@/components/manager/DepartmentIssuesWidget";
import ContentHeader from "@/components/ui/ContentHeader";

export default function MyTeamIssuesPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "Dept. Manager", "Manager"]}
      redirectOnNoAccess={true}
      noAccessMessage="Manager access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="My Team Issues"
        description="View and manage issues for your department"
      />
      <DepartmentIssuesWidget />
    </AccessControlWrapper>
  );
}