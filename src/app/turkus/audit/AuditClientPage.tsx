"use client";

import dynamic from "next/dynamic";

const AuditManager = dynamic(() => import("@/components/audit/AuditManager"), {
  ssr: false,
});

export default function AuditClientPage() {
  return <AuditManager />;
}
