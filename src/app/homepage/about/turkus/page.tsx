import Link from "next/link";

export default function TurkusPage() {
  return (
    <div
      className="turkus-bg"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #011f24 0%, #A259FF 100%)",
        paddingBottom: "3rem",
      }}
    >
      <section
        className="turkus-section"
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
          className="turkus-title"
          style={{
            color: "#A259FF",
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          Turkus
        </h2>
        <p
          className="turkus-description"
          style={{
            color: "#A259FF",
            fontSize: "1.1rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          Turkus is your central hub for managing controlled documents. Upload,
          version, and assign documents to users and roles, ensuring everyone
          has access to the latest information.
        </p>
        <ul
          className="turkus-list"
          style={{
            listStyle: "disc",
            paddingLeft: "1.5rem",
            color: "#A259FF",
            marginBottom: "2rem",
            fontSize: "1rem",
          }}
        >
          <li>Upload and organize documents by category</li>
          <li>Assign documents to users, roles, or departments</li>
          <li>Track document versions and changes</li>
          <li>Audit trails for compliance and review</li>
        </ul>
        <div
          className="turkus-back-link-wrapper"
          style={{ textAlign: "center", marginTop: "2rem" }}
        >
          <Link
            href="/"
            className="turkus-home-link"
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
