import Link from "next/link";

export default function TurkusPage() {
  return (
    <main className="neon-bg">
      <section className="neon-panel neon-panel-centered">
        <h2 className="neon-title">Turkus</h2>
        <p className="neon-description">
          Turkus is your central hub for managing controlled documents. Upload, version, and assign documents to users and roles, ensuring everyone has access to the latest information.
        </p>
        <ul className="neon-list">
          <li>Upload and organize documents by category</li>
          <li>Assign documents to users, roles, or departments</li>
          <li>Track document versions and changes</li>
          <li>Audit trails for compliance and review</li>
        </ul>
      </section>
    </main>
  );
}
