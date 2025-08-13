import Link from "next/link";

export default function TurkusPage() {
  return (
    <>
      <section className="turkus-section">
        <p className="text-lg mb-4 text-[#A259FF]">Turkus is your central hub for managing controlled documents. Upload, version, and assign documents to users and roles, ensuring everyone has access to the latest information.</p>
        <ul className="list-disc pl-6 text-[#A259FF] mb-8">
          <li>Upload and organize documents by category</li>
          <li>Assign documents to users, roles, or departments</li>
          <li>Track document versions and changes</li>
          <li>Audit trails for compliance and review</li>
        </ul>
        <p className="turkus-back">Back to <Link href="/" className="turkus-home-link">Home</Link>.</p>
      </section>
    </>
  )
}
