"use client";

import IssueManager from "@/components/manager/IssueManager";
import MainHeader from "@/components/ui/MainHeader";
import { useUser } from "@/lib/useUser";

export default function IssuesListPage() {
  const { user } = useUser();

  // Determine the appropriate subtitle based on user role
  const getSubtitle = () => {
    if (!user) return "Loading...";
    
    const accessLevel = user.access_level;
    if (accessLevel === "5") {
      return "View and manage reported issues across the entire organization";
    } else if (accessLevel === "4") {
      return "View and manage reported issues within your department";
    } else if (accessLevel === "3") {
      return "View reported issues (read-only access)";
    } else {
      return "Access restricted";
    }
  };

  return (
    <>
      <MainHeader
        title="Issues Management"
        subtitle={getSubtitle()}
      />
      <main className="after-hero global-content">
        <IssueManager />
      </main>
    </>
  );
}
