import AccessControlWrapper from "@/components/AccessControlWrapper";
import ManagerPageWrapper from "@/components/manager/ManagerPageWrapper";

export default function ManagerPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "Dept. Manager", "Manager"]}
      redirectOnNoAccess={true}
      noAccessMessage="Manager access required. Redirecting to your dashboard..."
    >
      <ManagerPageWrapper />
    </AccessControlWrapper>
  );
}
