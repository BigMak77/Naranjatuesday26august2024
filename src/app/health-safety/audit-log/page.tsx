"use client";

import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import NeonPanel from "@/components/NeonPanel";
import { FiClock } from "react-icons/fi";

export default function AuditLogPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "H&S Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Health & Safety access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Audit Trail"
        description="Review system activity logs and compliance audit history"
      />
      <NeonPanel>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <FiClock size={80} style={{ color: 'var(--neon)', margin: '0 auto 1.5rem', opacity: 0.8 }} />
          <h2 style={{ fontSize: '2rem', color: 'var(--neon)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Coming Soon
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Audit Trail
          </p>
        </div>
      </NeonPanel>
    </AccessControlWrapper>
  );
}
