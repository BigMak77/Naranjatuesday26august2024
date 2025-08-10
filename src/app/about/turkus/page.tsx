import HeroHeader from '@/components/HeroHeader'

export default function TurkusPage() {
  return (
    <>
      <HeroHeader
        title="Turkus"
        subtitle="Your central hub for managing controlled documents."
      />
      <section className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-lg mb-4 text-[#A259FF]">Turkus is your central hub for managing controlled documents. Upload, version, and assign documents to users and roles, ensuring everyone has access to the latest information.</p>
        <ul className="list-disc pl-6 text-[#A259FF] mb-8">
          <li>Upload and organize documents by category</li>
          <li>Assign documents to users, roles, or departments</li>
          <li>Track document versions and changes</li>
          <li>Audit trails for compliance and review</li>
        </ul>
        <p className="text-white">Back to <a href="/" className="text-[#A259FF] underline">Home</a>.</p>
      </section>
    </>
  )
}
