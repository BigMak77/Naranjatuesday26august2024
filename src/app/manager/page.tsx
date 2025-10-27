import AccessControlWrapper from "@/components/AccessControlWrapper";
import ManagerPageWrapper from "@/components/manager/ManagerPageWrapper";

export default function ManagerPage() {
  return (
    <AccessControlWrapper 
      requiredRoles={["Manager", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Manager access required. Redirecting to your dashboard..."
    >
      <ManagerPageWrapper />
    </AccessControlWrapper>
  );
}
