"use client";

import RaiseIssueWizard from "@/components/issues/RaiseIssueWizard";
import { useRouter } from "next/navigation";

export default function IssuesListPage() {
  const router = useRouter();

  const handleClose = () => {
    // Navigate back to dashboard or issues list
    router.push("/user/dashboard");
  };

  return (
    <div className="app-shell">
      <main className="content">
        <RaiseIssueWizard onClose={handleClose} />
      </main>
    </div>
  );
}
