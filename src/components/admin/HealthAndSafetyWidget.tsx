import React from "react";
import Link from "next/link";
import { FiFileText, FiAlertTriangle, FiClipboard, FiFolder } from "react-icons/fi";

const HS_ACTIONS = [
  {
    href: "/turkus/health-safety/policies",
    label: "View Policies",
    description: "Browse all health & safety policies.",
    icon: <FiFileText />,
  },
  {
    href: "/turkus/health-safety/assessments",
    label: "Risk Assessments",
    description: "View and manage risk assessments.",
    icon: <FiClipboard />,
  },
  {
    href: "/turkus/health-safety/incidents",
    label: "Report Incident",
    description: "Report a new health & safety incident.",
    icon: <FiAlertTriangle />,
  },
  {
    href: "/turkus/health-safety/resources",
    label: "Resources",
    description: "Access health & safety resources.",
    icon: <FiFolder />,
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

export default HealthAndSafetyWidget;
