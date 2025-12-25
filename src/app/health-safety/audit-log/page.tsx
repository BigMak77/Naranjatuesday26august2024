"use client";

import ComingSoonPage from "@/components/ui/ComingSoonPage";
import { FiClock } from "react-icons/fi";

export default function AuditLogPage() {
  return (
    <ComingSoonPage
      title="Audit Trail"
      description="Review system activity logs and compliance audit history"
      icon={FiClock}
      featureName="Audit Trail"
    />
  );
}
