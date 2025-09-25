// components/utility/UtilityWidget.tsx
"use client";

import DocumentTypeTable from "@/components/documents/DocumentTypeTable";
import ShiftPatternsTable from "@/components/utility/ShiftPatternsTable";

export default function UtilityWidget() {
  return (
    <div className="utility-widget">
      <DocumentTypeTable />
      <div style={{ height: 32 }} />
      <ShiftPatternsTable />
    </div>
  );
}
