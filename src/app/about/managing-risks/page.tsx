import Link from "next/link";

export default function ManagingRisksAboutPage() {
  return (
    <div className="bg-[#011f24] min-h-screen pb-12">
      <section className="managing-risks-section">
        <p className="text-lg mb-4 text-[#fffbcf]">Managing risks means identifying, assessing, and controlling hazards in the workplace. Naranja provides tools for risk assessments, training, and real-time hazard tracking to keep your team safe and your operations compliant.</p>
        <ul className="list-disc pl-6 text-[#fffbcf] mb-8">
          <li>Custom risk assessments for roles, departments, and equipment</li>
          <li>Integrated training modules for legal and SOP compliance</li>
          <li>Real-time hazard tracking and corrective actions</li>
          <li>Manager dashboards for monitoring and reporting</li>
          <li>Full audit trails for inspections</li>
        </ul>
        <p className="managing-risks-back">Back to <Link href="/" className="managing-risks-home-link">Home</Link>.</p>
      </section>
    </div>
  )
}
