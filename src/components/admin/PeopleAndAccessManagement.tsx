import React from "react";
import Link from "next/link";

const PEOPLE_ACTIONS = [
  {
    href: "/admin/users/invite",
    label: "Invite User",
    description: "Send an invitation to a new user.",
    className: "neon-btn neon-btn-add",
  },
  {
    href: "/admin/roles",
    label: "Manage Roles",
    description: "Edit or assign user roles.",
    className: "neon-btn neon-btn-view",
  },
  {
    href: "/admin/leavers",
    label: "Manage Leavers",
    description: "View and process users who are leaving.",
    className: "neon-btn neon-btn-view",
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

export default PeopleAndAccessManagement;
