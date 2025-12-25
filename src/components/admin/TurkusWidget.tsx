import React from "react";
import Link from "next/link";
import { FiClipboard, FiCheckSquare, FiPlus } from "react-icons/fi";

const TURKUS_ACTIONS = [
  {
    href: "/turkus/audit",
    label: "Create Audit",
    description: "Start a new Turkus audit process.",
    icon: <FiClipboard />,
  },
  {
    href: "/tasks",
    label: "Tasks Manager",
    description: "The complete task manager to create, assign, and track tasks.",
    icon: <FiCheckSquare />,
  },
  {
    href: "/turkus/issues",
    label: "Manage Issues",
    description: "View and manage all reported issues across departments.",
    icon: <FiClipboard />,
  },
  {
    href: "/turkus/issues/add",
    label: "Create New Issue",
    description: "Report a new issue that needs attention.",
    icon: <FiPlus />,
  },
];

const TurkusWidget: React.FC = () => {
  return (
    <section className="neon-card neon-form-padding">
      <h2 className="neon-heading">Turkus Management</h2>
      <div className="turkus-widget-content">
        <p className="neon-text">
          Access Turkus modules, manage assignments, and view Turkus-specific reports.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {TURKUS_ACTIONS.map((action) => (
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

export default TurkusWidget;
