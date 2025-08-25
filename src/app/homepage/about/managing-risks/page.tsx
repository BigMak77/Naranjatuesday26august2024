import Link from "next/link";

export default function ManagingRisksAboutPage() {
  return (
    <div
      className="managing-risks-bg"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #011f24 0%, #40E0D0 100%)",
        paddingBottom: "3rem",
      }}
    >
      <section
        className="managing-risks-section"
        style={{
          background: "var(--panel)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-neon)",
          padding: "2.5rem 2rem",
          margin: "2rem auto",
          maxWidth: 700,
        }}
      >
        <h2
          className="managing-risks-title"
          style={{
            color: "var(--accent)",
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          Managing Risks
        </h2>
        <p
          className="managing-risks-description"
          style={{
            color: "#fffbcf",
            fontSize: "1.1rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          Managing risks means identifying, assessing, and controlling hazards
          in the workplace. Naranja provides tools for risk assessments,
          training, and real-time hazard tracking to keep your team safe and
          your operations compliant.
        </p>
        <ul
          className="managing-risks-list"
          style={{
            listStyle: "disc",
            paddingLeft: "1.5rem",
            color: "#fffbcf",
            marginBottom: "2rem",
            fontSize: "1rem",
          }}
        >
          <li>Custom risk assessments for roles, departments, and equipment</li>
          <li>Integrated training modules for legal and SOP compliance</li>
          <li>Real-time hazard tracking and corrective actions</li>
          <li>Manager dashboards for monitoring and reporting</li>
          <li>Full audit trails for inspections</li>
        </ul>
        <div
          className="managing-risks-back-link-wrapper"
          style={{ textAlign: "center", marginTop: "2rem" }}
        >
          <Link
            href="/"
            className="managing-risks-home-link"
            style={{
              color: "var(--neon)",
              textDecoration: "underline",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
