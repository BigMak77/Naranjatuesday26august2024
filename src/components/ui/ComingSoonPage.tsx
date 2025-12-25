"use client";

import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import NeonPanel from "@/components/NeonPanel";
import type { IconType } from "react-icons";
import type { AccessLevel } from "@/lib/permissions";

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: IconType;
  featureName: string;
  requiredRoles?: AccessLevel | AccessLevel[];
}

export default function ComingSoonPage({
  title,
  description,
  icon: Icon,
  featureName,
  requiredRoles = ["Super Admin", "Admin", "H&S Admin"],
}: ComingSoonPageProps) {
  return (
    <AccessControlWrapper
      requiredRoles={requiredRoles}
      redirectOnNoAccess={true}
      noAccessMessage="Health & Safety access required. Redirecting to your dashboard..."
    >
      <ContentHeader title={title} description={description} />
      <NeonPanel>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Icon size={80} style={{ color: 'var(--neon)', margin: '0 auto 1.5rem', opacity: 0.8 }} />
          <h2 style={{ fontSize: '2rem', color: 'var(--neon)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Coming Soon
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            {featureName}
          </p>
        </div>
      </NeonPanel>
    </AccessControlWrapper>
  );
}
