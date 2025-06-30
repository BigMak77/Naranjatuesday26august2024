'use client'

import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

export default function ManagingRisksPage() {
  return (
    <>
      <LogoHeader />

      <main className="min-h-screen bg-white text-teal-900 flex flex-col">
        <div className="max-w-5xl mx-auto px-4 pt-10 space-y-10">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-teal-100 to-white p-8 rounded-xl shadow-md">
            <h1 className="text-4xl font-bold text-center text-teal-800 mb-4">
              🛡️ Managing Risks in the Workplace
            </h1>
            <p className="text-center text-lg max-w-3xl mx-auto">
              Effective training and proactive risk assessment are the cornerstones of a safe and efficient workplace.
              At <span className="font-semibold">Naranja</span>, we help manufacturers build safer teams, reduce
              incidents, and maintain compliance with ease.
            </p>
          </section>

          {/* The Impact of Training & Risk Assessment */}
          <section className="bg-white p-6 rounded-xl shadow border border-teal-200 space-y-4">
            <h2 className="text-2xl font-semibold text-teal-800">
              📉 Reducing Accidents, Injuries, and Lost Time
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed">
              <li>
                <strong>Accidents are preventable:</strong> Most workplace incidents result from unaddressed risks or
                lack of awareness. Training empowers staff to recognize and respond to hazards.
              </li>
              <li>
                <strong>Injuries impact everyone:</strong> A single injury can disrupt teams, delay production, and
                damage morale. Proactive risk assessments target root causes before incidents occur.
              </li>
              <li>
                <strong>Lost time is costly:</strong> Downtime from injuries or investigations costs more than just
                productivity — it can harm your brand, customer trust, and team culture.
              </li>
            </ul>
          </section>

          {/* What Naranja Offers */}
          <section className="bg-teal-50 p-6 rounded-xl shadow-md border border-teal-100 space-y-3">
            <h2 className="text-2xl font-semibold text-teal-800">🧰 Our Solutions</h2>
            <ul className="list-disc pl-6 text-base space-y-1">
              <li>
                Custom-built risk assessments tailored to specific roles, departments, and equipment
              </li>
              <li>Integrated training modules that align with SOPs and legal standards</li>
              <li>Real-time hazard tracking and corrective action follow-ups</li>
              <li>Manager dashboards to monitor completion rates and overdue actions</li>
              <li>Full audit trails and review history for internal or external inspections</li>
            </ul>
          </section>

          {/* Closing Statement */}
          <section className="bg-teal-800 text-white p-6 rounded-xl shadow text-center">
            <h2 className="text-2xl font-semibold mb-2">Safe Teams. Stronger Operations.</h2>
            <p className="text-lg max-w-3xl mx-auto">
              Risk management isn't just a box to tick — it's a culture to build. With Naranja, you're not just
              protecting your team — you're investing in resilience, productivity, and trust.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
