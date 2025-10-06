"use client";

import React from "react";
import Link from "next/link";
import {
  FiUsers,
  FiPlus,
  FiGrid,
  FiClipboard,
  FiPieChart,
  FiAlertTriangle,
  FiFileText,
  FiBookOpen,
  FiShield,
  FiActivity,
  FiSettings,
  FiHome,
  FiCheckCircle,
  FiBarChart2,
  FiDatabase,
  FiLayers,
  FiUserCheck,
  FiClock,
} from "react-icons/fi";
import MainHeader from "@/components/ui/MainHeader";
import PeopleAndAccessManagement from "@/components/admin/PeopleAndAccessManagement";
import TurkusWidget from "@/components/admin/TurkusWidget";
import HealthAndSafetyWidget from "@/components/admin/HealthAndSafetyWidget";
import DocumentsModulesResourcesWidget from "@/components/admin/DocumentsModulesResourcesWidget";

/*********************************
 * Types
 *********************************/
interface DashboardAction {
  href: string;
  label: React.ReactNode; // usually <Icon/> Text
  className?: string; // keep for future variants
  ariaLabel?: string; // spoken label for icon-only buttons
}

interface DashboardSection {
  key: string;
  title: string;
  icon: React.ReactNode; // large icon for card header
  primary: DashboardAction; // main click target for the card
  actions?: DashboardAction[]; // secondary icon-only actions
}


/*********************************
 * Helpers
 *********************************/
// Pull the first child of a label (usually the icon). Fallback to a generic icon.
function leadingIcon(node: React.ReactNode) {
  if (React.isValidElement(node)) {
    const children = (node.props as any)?.children;
    if (Array.isArray(children) && children[0]) return children[0];
  }
  return <FiActivity aria-hidden />;
}

/*********************************
 * Presentational components (match your global CSS)
 *********************************/
function FeatureCard({
  title,
  icon,
  primary,
  actions = [],
}: Pick<DashboardSection, "title" | "icon" | "primary" | "actions">) {
  return (
    <div className="neon-feature-card" role="region" aria-label={title}>
      <Link href={primary.href} aria-label={primary.ariaLabel || title}>
        <div className="neon-feature-card-header">
          <span aria-hidden>{icon}</span>
          <span className="neon-feature-card-title">{title}</span>
        </div>
        {/* Optional intro text area if you want */}
        {/* <p className="neon-feature-card-text">Short description</p> */}
      </Link>

      {actions.length > 0 && (
        <div className="neon-feature-card-children" aria-label={`${title} actions`}>
          {/* Use icon-only square buttons to respect your .neon-btn sizing */}
          {actions.map((a, i) => (
            <Link
              key={`${title}-action-${i}`}
              href={a.href}
              className="neon-btn-square"
              aria-label={a.ariaLabel || (typeof a.label === "string" ? a.label : undefined)}
              title={a.ariaLabel || (typeof a.label === "string" ? a.label : undefined)}
            >
              {/* Only render the leading icon to avoid clipped text inside 40x40 */}
              {leadingIcon(a.label)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/*********************************
 * Page
 *********************************/
export default function DashboardPage() {
  return (
    <>
      <MainHeader
        title="Admin Dashboard"
        subtitle="Quick access to modules, documents, roles, and health & safety"
      />
      <section
        aria-label="Dashboard widgets"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1.5rem",
          marginTop: "1.5rem",
          alignItems: "stretch",
        }}
      >
        <PeopleAndAccessManagement />
        <DocumentsModulesResourcesWidget />
        <TurkusWidget />
        <HealthAndSafetyWidget />
      </section>
    </>
  );
}
