// components/utility/UtilityWidget.tsx
"use client";

import DocumentTypeTable from "@/components/documents/DocumentTypeTable";
import ShiftPatternsTable from "@/components/utility/ShiftPatternsTable";
import DepartmentRoleManager from "@/components/utility/DepartmentRoleManager";

export default function UtilityWidget() {
  return (
    <div className="utility-widget space-y-8">
      <DepartmentRoleManager />
      <DocumentTypeTable />
      <ShiftPatternsTable />
    </div>
  );
}
