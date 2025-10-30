import React from "react";
import PermissionManager from "@/components/admin/PermissionManager";
import ContentHeader from "@/components/ui/ContentHeader";

export default function AccessManagerPage() {
  return (
    <main className="after-hero">
      <div className="global-content">
        <ContentHeader
          title="Access Manager"
          description="Manage system permissions and access controls"
        />
        <PermissionManager />
      </div>
    </main>
  );
}
