"use client";

import ComingSoonPage from "@/components/ui/ComingSoonPage";
import { FiSettings } from "react-icons/fi";

export default function SettingsPage() {
  return (
    <ComingSoonPage
      title="System Settings"
      description="Configure notification preferences, incident types, and system defaults"
      icon={FiSettings}
      featureName="System Settings"
    />
  );
}
