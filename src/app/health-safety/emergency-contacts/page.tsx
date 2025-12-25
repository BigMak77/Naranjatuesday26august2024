"use client";

import ComingSoonPage from "@/components/ui/ComingSoonPage";
import { FiPhone } from "react-icons/fi";

export default function EmergencyContactsPage() {
  return (
    <ComingSoonPage
      title="Emergency Contacts"
      description="Manage emergency contact lists and notification settings"
      icon={FiPhone}
      featureName="Emergency Contacts"
    />
  );
}
