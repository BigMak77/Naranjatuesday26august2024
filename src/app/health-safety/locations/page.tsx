"use client";

import ComingSoonPage from "@/components/ui/ComingSoonPage";
import { FiMapPin } from "react-icons/fi";

export default function LocationsPage() {
  return (
    <ComingSoonPage
      title="Location Management"
      description="Manage sites, areas, and zones for incident reporting and risk assessments"
      icon={FiMapPin}
      featureName="Location Management"
    />
  );
}
