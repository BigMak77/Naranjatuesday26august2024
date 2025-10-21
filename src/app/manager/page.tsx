import RequireAccess from "@/components/RequireAccess";
import ManagerPageWrapper from "@/components/manager/ManagerPageWrapper";

export default function ManagerPage() {
  return (
    <RequireAccess allowedRoles={["Manager", "Admin"]}>
      <ManagerPageWrapper />
    </RequireAccess>
  );
}
