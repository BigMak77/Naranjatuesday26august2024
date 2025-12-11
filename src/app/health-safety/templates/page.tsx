"use client";

import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import NeonPanel from "@/components/NeonPanel";
import { FiFileText } from "react-icons/fi";

export default function TemplatesPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "H&S Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Health & Safety access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Safety Templates"
        description="Access and customize safety forms, checklists, and documentation templates"
      />
      <NeonPanel>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <FiFileText size={80} style={{ color: 'var(--neon)', margin: '0 auto 1.5rem', opacity: 0.8 }} />
          <h2 style={{ fontSize: '2rem', color: 'var(--neon)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Coming Soon
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Safety Templates
          </p>
        </div>
      </NeonPanel>
    </AccessControlWrapper>
  );
}
