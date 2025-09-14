import React from "react";
import Link from "next/link";

const TURKUS_ACTIONS = [
  {
    href: "/turkus/reports",
    label: "Turkus Reports",
    description: "View and analyze Turkus-related reports.",
    className: "neon-btn neon-btn-view",
  },
  {
    href: "/turkus/auditors",
    label: "Manage Turkus Auditors",
    description: "Add or remove auditors for Turkus audits.",
    className: "neon-btn neon-btn-view",
  },
  {
    href: "/turkus/audit",
    label: "Create Audit",
    description: "Start a new Turkus audit process.",
    className: "neon-btn neon-btn-add",
  },
  {
    href: "/turkus/assignments",
    label: "View Turkus Assignments",
    description: "See all current Turkus assignments.",
    className: "neon-btn neon-btn-view",
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
              <Link href={action.href} className={action.className} style={{ minWidth: 160, textAlign: "center" }}>
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

export default TurkusWidget;
