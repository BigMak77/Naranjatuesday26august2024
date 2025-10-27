import AccessControlWrapper from "@/components/AccessControlWrapper";
import DepartmentIssuesWidget from "@/components/manager/DepartmentIssuesWidget";

export default function MyTeamIssuesPage() {
  return (
    <AccessControlWrapper 
      requiredRoles={["Manager", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Manager access required. Redirecting to your dashboard..."
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Team Issues</h1>
          <p className="text-gray-300">View and manage issues for your department</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <DepartmentIssuesWidget />
        </div>
      </div>
    </AccessControlWrapper>
  );
}