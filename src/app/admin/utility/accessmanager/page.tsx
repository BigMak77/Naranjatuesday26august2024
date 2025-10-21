import React from "react";
import PermissionManager from "@/components/admin/PermissionManager";
import MainHeader from "@/components/ui/MainHeader";

export default function AccessManagerPage() {
  return (
    <main className="after-hero">
      <div className="global-content">
        <MainHeader 
          title="Access Manager" 
          subtitle="Manage system permissions and access controls" 
        />
        <PermissionManager />
      </div>
    </main>
  );
}
