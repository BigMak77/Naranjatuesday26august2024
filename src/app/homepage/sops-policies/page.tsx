export default function SopsPoliciesPage() {
  return (
    <main className="neon-bg">
      <section 
        className="neon-panel"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 43, 91, 0.95), rgba(0, 43, 91, 0.95)), url(/audit.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
          width: '100%'
        }}
      >
        <h2 className="neon-title">SOPs & Policies</h2>
        <p className="neon-description">
          Standard Operating Procedures (SOPs) and Policies are essential documents that define how tasks are performed and outline company rules. In Naranja, you can create, assign, and manage SOPs and policies for every role, ensuring compliance and clarity across your organization.
        </p>
        <ul className="neon-list">
          <li>Assign SOPs and policies to specific roles and departments</li>
          <li>Track completion and compliance for each user</li>
          <li>Version control and audit history for all documents</li>
        </ul>
      </section>
    </main>
  );
}
