import React from "react";
import Link from "next/link";
import { FiBookOpen, FiBook } from "react-icons/fi";

const MODULES_ACTIONS = [
  {
    href: "/admin/modules",
    label: "View Training Modules",
    description: "Browse and manage all training modules.",
    icon: <FiBookOpen />,
  },
  {
    href: "/admin/modules/create",
    label: "Add New Module",
    description: "Create a new training module.",
    icon: <FiBook />,
  },
];

/**
 * DocumentsModulesResourcesWidget
 * Central admin widget for managing training modules.
 */
const DocumentsModulesResourcesWidget: React.FC = () => {
  return (
    <section className="neon-card neon-form-padding">
      <h2 className="neon-heading">Training Modules</h2>
      <div className="documents-widget-content">
        <p className="neon-text">
          Manage company training modules from one place.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {MODULES_ACTIONS.map((action) => (
            <li key={action.href} style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: 16 }}>
              <Link href={action.href} className="large-neon-icon-btn" style={{ minWidth: 60, minHeight: 60, justifyContent: "center" }}>
                {React.cloneElement(action.icon, { style: { width: 40, height: 40, color: "var(--neon)" } })}
              </Link>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: "var(--neon)", marginBottom: 2 }}>{action.label}</div>
                <span className="neon-muted" style={{ fontSize: 12 }}>{action.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default DocumentsModulesResourcesWidget;
