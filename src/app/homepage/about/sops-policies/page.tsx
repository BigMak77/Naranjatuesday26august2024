import Link from "next/link";

export default function SopsPoliciesPage() {
  return (
    <div
      className="sops-policies-bg"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #013b3b 0%, #40E0D0 100%)",
      }}
    >
      <div className="after-hero">
        <div className="global-content">
          <section
            className="sops-policies-section"
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
              className="sops-policies-title"
              style={{
                color: "var(--accent)",
                fontSize: "2rem",
                fontWeight: 800,
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              SOPs & Policies
            </h2>
            <p
              className="sops-policies-description"
              style={{
                color: "var(--neon)",
                fontSize: "1.1rem",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              Standard Operating Procedures (SOPs) and Policies are essential
              documents that define how tasks are performed and outline company
              rules. In Naranja, you can create, assign, and manage SOPs and
              policies for every role, ensuring compliance and clarity across
              your organization.
            </p>
            <ul
              className="sops-policies-list"
              style={{
                listStyle: "disc",
                paddingLeft: "1.5rem",
                color: "#fffbcf",
                marginBottom: "2rem",
                fontSize: "1rem",
              }}
            >
              <li>
                Assign SOPs and policies to specific roles and departments
              </li>
              <li>Track completion and compliance for each user</li>
              <li>Version control and audit history for all documents</li>
            </ul>
            <div
              className="sops-policies-back-link-wrapper"
              style={{ textAlign: "center", marginTop: "2rem" }}
            >
              <Link
                href="/"
                className="sops-policies-home-link"
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
      </div>
    </div>
  );
}
