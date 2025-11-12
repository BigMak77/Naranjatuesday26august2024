"use client";

import React from "react";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function TurkusAuditorsPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "H&S Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to manage Turkus auditors."
    >
      <div>
        <h1>Turkus Auditors</h1>
        <p>This is a placeholder page for Turkus auditors.</p>
      </div>
    </AccessControlWrapper>
  );
}
