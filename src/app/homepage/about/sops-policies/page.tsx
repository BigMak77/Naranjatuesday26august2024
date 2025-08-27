import Link from "next/link";

export default function SopsPoliciesPage() {
  return (
    <main className="neon-bg">
      <section className="neon-panel neon-panel-centered">
        <h2 className="neon-title">SOPs & Policies</h2>
        <p className="neon-description">
          Standard Operating Procedures (SOPs) and Policies are essential documents that define how tasks are performed and outline company rules. In Naranja, you can create, assign, and manage SOPs and policies for every role, ensuring compliance and clarity across your organization.
        </p>
        <ul className="neon-list">
          <li>Assign SOPs and policies to specific roles and departments</li>
          <li>Track completion and compliance for each user</li>
          <li>Version control and audit history for all documents</li>
        </ul>
        <div className="neon-back-link-wrapper">
          <Link href="/homepage" className="neon-back-link" aria-label="Back to homepage">
            {/* Feather icon for back arrow */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
