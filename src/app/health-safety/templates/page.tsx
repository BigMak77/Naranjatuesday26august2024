"use client";

import ComingSoonPage from "@/components/ui/ComingSoonPage";
import { FiFileText } from "react-icons/fi";

export default function TemplatesPage() {
  return (
    <ComingSoonPage
      title="Safety Templates"
      description="Access and customize safety forms, checklists, and documentation templates"
      icon={FiFileText}
      featureName="Safety Templates"
    />
  );
}
