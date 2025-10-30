import React from "react";
import HealthSafetyPolicyManager from "@/components/healthsafety/HealthSafetyPolicyManager";
import ContentHeader from "@/components/ui/ContentHeader";

export default function HealthSafetyPoliciesPage() {
  return (
    <>
      <ContentHeader
        title="Health & Safety Policies"
        description="Manage health and safety policies and procedures"
      />
      <HealthSafetyPolicyManager />
    </>
  );
}
