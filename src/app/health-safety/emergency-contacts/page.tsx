"use client";

import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import NeonPanel from "@/components/NeonPanel";
import { FiPhone } from "react-icons/fi";

export default function EmergencyContactsPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "H&S Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Health & Safety access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Emergency Contacts"
        description="Manage emergency contact lists and notification settings"
      />
      <NeonPanel>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <FiPhone size={80} style={{ color: 'var(--neon)', margin: '0 auto 1.5rem', opacity: 0.8 }} />
          <h2 style={{ fontSize: '2rem', color: 'var(--neon)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Coming Soon
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Emergency Contacts
          </p>
        </div>
      </NeonPanel>
    </AccessControlWrapper>
  );
}
