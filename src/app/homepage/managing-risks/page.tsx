import Link from "next/link";

export default function ManagingRisksAboutPage() {
  return (
    <main className="neon-bg">
      <section className="neon-panel neon-panel-centered">
        <h2 className="neon-title">Managing Risks</h2>
        <p className="neon-description">
          Managing risks means identifying, assessing, and controlling hazards in the workplace. Naranja provides tools for risk assessments, training, and real-time hazard tracking to keep your team safe and your operations compliant.
        </p>
        <ul className="neon-list">
          <li>Custom risk assessments for roles, departments, and equipment</li>
          <li>Integrated training modules for legal and SOP compliance</li>
          <li>Real-time hazard tracking and corrective actions</li>
          <li>Manager dashboards for monitoring and reporting</li>
          <li>Full audit trails for inspections</li>
        </ul>
      </section>
    </main>
  );
}
