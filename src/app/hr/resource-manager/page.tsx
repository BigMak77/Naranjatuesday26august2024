import UserManager from "@/components/userview/HrAdminView";
import ContentHeader from "@/components/ui/ContentHeader";

export default function ResourceManagerPage() {
  return (
    <>
      <ContentHeader
        title="Resource Manager"
        description="Manage human resources and employee data"
      />
      <UserManager />
    </>
  );
}
