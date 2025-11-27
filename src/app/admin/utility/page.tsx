"use client";

import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import UtilitiesManager from "@/components/utility/UtilitiesManager";

export default function UtilityPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to access admin utilities."
    >
      <main className="after-hero">
        <ContentHeader
          title="Admin Utilities"
          description="Utilities are similar to global settings, that improve the functionality of the platform."
        />
        <div className="global-content">
          <UtilitiesManager />
        </div>
      </main>
    </AccessControlWrapper>
  );
}