import React from "react";
import Link from "next/link";

const HS_ACTIONS = [
  {
    href: "/turkus/health-safety/policies",
    label: "View Policies",
    description: "Browse all health & safety policies.",
    className: "neon-btn neon-btn-view",
  },
  {
    href: "/turkus/health-safety/assessments",
    label: "Risk Assessments",
    description: "View and manage risk assessments.",
    className: "neon-btn neon-btn-view",
  },
  {
    href: "/turkus/health-safety/incidents",
    label: "Report Incident",
    description: "Report a new health & safety incident.",
    className: "neon-btn neon-btn-add",
  },
  {
    href: "/turkus/health-safety/resources",
    label: "Resources",
    description: "Access health & safety resources.",
    className: "neon-btn neon-btn-view",
  },
];

const HealthAndSafetyWidget: React.FC = () => {
  return (
    <section className="neon-card neon-form-padding">
      <h2 className="neon-heading">Health & Safety</h2>
      <div className="hs-widget-content">
        <p className="neon-text">
          View and manage health & safety policies, incidents, and resources.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {HS_ACTIONS.map((action) => (
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

export default HealthAndSafetyWidget;
