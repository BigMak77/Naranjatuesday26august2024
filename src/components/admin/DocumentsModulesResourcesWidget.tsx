import React from "react";
import Link from "next/link";

const DOCS_ACTIONS = [
  {
    href: "/admin/documents",
    label: "View All Documents",
    description: "Browse and manage all company documents.",
    className: "neon-btn neon-btn-view",
  },
  {
    href: "/admin/documents/create",
    label: "Add New Document",
    description: "Upload or create a new document.",
    className: "neon-btn neon-btn-add",
  },
  {
    href: "/admin/modules",
    label: "View Training Modules",
    description: "Browse and manage all training modules.",
    className: "neon-btn neon-btn-view",
  },
  {
    href: "/admin/modules/create",
    label: "Add New Module",
    description: "Create a new training module.",
    className: "neon-btn neon-btn-add",
  },
  {
    href: "/admin/resources",
    label: "View Resources",
    description: "Access shared company resources.",
    className: "neon-btn neon-btn-view",
  },
  {
    href: "/admin/resources/upload",
    label: "Upload Resource",
    description: "Upload a new resource for company use.",
    className: "neon-btn neon-btn-add",
  },
];

/**
 * DocumentsModulesResourcesWidget
 * Central admin widget for managing documents, modules, and resources.
 */
const DocumentsModulesResourcesWidget: React.FC = () => {
  return (
    <section className="neon-card neon-form-padding">
      <h2 className="neon-heading">Documents, Modules & Resources</h2>
      <div className="documents-widget-content">
        <p className="neon-text">
          Manage company documents, training modules, and shared resources from one place.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {DOCS_ACTIONS.map((action) => (
            <li key={action.href} style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: 16 }}>
              <Link href={action.href} className={action.className} style={{ minWidth: 180, textAlign: "center" }}>
                {action.label}
              </Link>
              <span style={{ color: "#aaa", fontSize: 15 }}>{action.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default DocumentsModulesResourcesWidget;
