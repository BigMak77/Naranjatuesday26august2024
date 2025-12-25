"use client";

import ComingSoonPage from "@/components/ui/ComingSoonPage";
import { FiBarChart2 } from "react-icons/fi";

export default function ReportsPage() {
  return (
    <ComingSoonPage
      title="Reports & Analytics"
      description="View incident trends, weather correlations, and safety metrics"
      icon={FiBarChart2}
      featureName="Reports & Analytics"
    />
  );
}
