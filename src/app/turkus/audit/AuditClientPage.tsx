"use client";

import dynamic from "next/dynamic";
import AccessControlWrapper from "@/components/AccessControlWrapper";

const AuditManager = dynamic(() => import("@/components/audit/AuditManager"), {
  ssr: false,
});

export default function AuditClientPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "H&S Admin", "Dept. Manager", "Manager"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to access the Audit system."
    >
      <AuditManager />
    </AccessControlWrapper>
  );
}
