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
      <div className="container mx-auto px-4 py-8">
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <DepartmentIssuesWidget />
        </div>
      </div>
    </AccessControlWrapper>
  );
}