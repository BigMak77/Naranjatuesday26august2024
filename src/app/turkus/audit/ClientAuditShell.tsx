"use client";

import dynamic from "next/dynamic";

const AuditManager = dynamic(() => import("@/components/AuditManager"), {
  ssr: false,
});

export default function ClientAuditShell() {
  return <AuditManager />;
}
