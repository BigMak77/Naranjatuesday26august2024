"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { useContext, useEffect } from "react";
import { RaiseIssueModalContext } from "@/context/RaiseIssueModalContext";
import { getDashboardUrl } from "@/lib/permissions";
import NeonPanel from "@/components/NeonPanel";
import ContentHeader from "@/components/ui/ContentHeader";

export default function RaiseIssuePage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const raiseIssueModalCtx = useContext(RaiseIssueModalContext);

  // Once user is loaded, open the modal and redirect to their dashboard
  useEffect(() => {
    if (!loading && user) {
      raiseIssueModalCtx?.openRaiseIssue();
      const dashboardUrl = getDashboardUrl(user.access_level, user.location);
      router.replace(dashboardUrl);
    } else if (!loading && !user) {
      router.push("/homepage/login");
    }
  }, [loading, user, raiseIssueModalCtx, router]);

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

  // Show redirecting message
  return (
    <>
      <ContentHeader
        title="Raise Issue"
        description="Report a new issue or concern to the appropriate department"
      />
      <div style={{ maxWidth: 480, margin: '3rem auto' }}>
        <NeonPanel>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            {user ? "Opening raise issue dialog..." : "Redirecting to login..."}
          </div>
        </NeonPanel>
      </div>
    </>
  );
}
