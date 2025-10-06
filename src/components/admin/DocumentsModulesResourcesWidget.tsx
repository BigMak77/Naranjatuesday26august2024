import React from "react";
import Link from "next/link";
import { FiFileText, FiFilePlus, FiBookOpen, FiBook, FiFolder, FiUpload } from "react-icons/fi";

const DOCS_ACTIONS = [
  {
    href: "/admin/documents",
    label: "Document Manager",
    description: "Maintain all documnet types.",
    icon: <FiFileText />,
  },
  
  
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
  {
    href: "/admin/resources",
    label: "View Resources",
    description: "Access shared company resources.",
    icon: <FiFolder />,
  },
  {
    href: "/admin/resources/upload",
    label: "Upload Resource",
    description: "Upload a new resource for company use.",
    icon: <FiUpload />,
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
