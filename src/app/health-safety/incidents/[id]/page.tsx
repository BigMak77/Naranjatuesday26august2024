"use client";

import ComingSoonPage from "@/components/ui/ComingSoonPage";
import { FiAlertCircle } from "react-icons/fi";

export default function IncidentDetailPage() {
  return (
    <ComingSoonPage
      title="Incident Details"
      description="View detailed information about a specific incident"
      icon={FiAlertCircle}
      featureName="Incident Details View"
    />
  );
}
