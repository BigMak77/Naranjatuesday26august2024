"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import RaiseIssueWizard from "@/components/issues/RaiseIssueWizard";
import NeonPanel from "@/components/NeonPanel";
import ContentHeader from "@/components/ui/ContentHeader";

export default function RaiseIssuePage() {
  const router = useRouter();
  const { user, loading } = useUser();

  const handleClose = () => {
    router.push("/turkus/issues");
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <>
        <ContentHeader 
          title="Raise Issue"
          description="Report a new issue or concern to the appropriate department"
        />
        <div style={{ maxWidth: 480, margin: '3rem auto' }}>
          <NeonPanel>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Loading...
            </div>
          </NeonPanel>
        </div>
      </>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/homepage/login");
    return (
      <>
        <ContentHeader 
          title="Raise Issue"
          description="Report a new issue or concern to the appropriate department"
        />
        <div style={{ maxWidth: 480, margin: '3rem auto' }}>
          <NeonPanel>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Redirecting to login...
            </div>
          </NeonPanel>
        </div>
      </>
    );
  }

  // Render the wizard for any authenticated user
  return (
    <>
      <ContentHeader 
        title="Raise Issue"
        description="Report a new issue or concern to the appropriate department"
      />
      <RaiseIssueWizard onClose={handleClose} />
    </>
  );
}
