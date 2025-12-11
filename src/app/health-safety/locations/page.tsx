"use client";

import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import NeonPanel from "@/components/NeonPanel";
import { FiMapPin } from "react-icons/fi";

export default function LocationsPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "H&S Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Health & Safety access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Location Management"
        description="Manage sites, areas, and zones for incident reporting and risk assessments"
      />
      <NeonPanel>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <FiMapPin size={80} style={{ color: 'var(--neon)', margin: '0 auto 1.5rem', opacity: 0.8 }} />
          <h2 style={{ fontSize: '2rem', color: 'var(--neon)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Coming Soon
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Location Management
          </p>
        </div>
      </NeonPanel>
    </AccessControlWrapper>
  );
}
