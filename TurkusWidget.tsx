import React from "react";
import Link from "next/link";

/**
 * TurkusWidget
 * Central admin widget for managing Turkus-related features and quick access.
 */
const TurkusWidget: React.FC = () => {
  return (
    <section className="neon-card neon-form-padding">
      <h2 className="neon-heading">Turkus Management</h2>
      <div className="turkus-widget-content">
        <p className="neon-text">
          Access Turkus modules, manage assignments, and view Turkus-specific reports.
        </p>
        <div className="turkus-widget-actions">
          <Link href="/turkus/tasks/assign" className="neon-btn neon-btn-add">Assign Turkus Task</Link>
          <Link href="/turkus/reports" className="neon-btn neon-btn-view">Turkus Reports</Link>
          <Link href="/turkus/auditors" className="neon-btn neon-btn-view">Manage Turkus Auditors</Link>
          <Link href="/turkus/audit" className="neon-btn neon-btn-add">Create Audit</Link>
          <Link href="/turkus/assignments" className="neon-btn neon-btn-view">View Turkus Assignments</Link>
        </div>
      </div>
    </section>
  );
};

export default TurkusWidget;
