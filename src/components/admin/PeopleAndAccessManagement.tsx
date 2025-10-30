import React from "react";
import Link from "next/link";
import { FiUserPlus, FiShield, FiUserX } from "react-icons/fi";

const PEOPLE_ACTIONS = [
  {
    href: "/admin/users/invite",
    label: "Invite User",
    description: "Send an invitation to a new user.",
    icon: <FiUserPlus />,
  },
  {
    href: "/training/matrix",
    label: "Training Matrix",
    description: "View training via matrix (filterable).",
    icon: <FiShield />,
  },
  {
    href: "/hr/resource-manager",
    label: "RESOURCES MANAGER",
    description: "RESOURCE MANAGER ___ UNDER DEVELOPMENT.",
    icon: <FiUserX />,
  },
];

/**
 * PeopleAndAccessManagement Widget
 * A central admin widget for managing users, roles, and department access.
 */
const PeopleAndAccessManagement: React.FC = () => {
  return (
    <section className="neon-card neon-form-padding">
      <h2 className="neon-heading">People & Access Management</h2>
      <div className="people-widget-content">
        <p className="neon-text">
          Manage users, roles, trainers, and leavers in your organization.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {PEOPLE_ACTIONS.map((action) => (
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

export default PeopleAndAccessManagement;
