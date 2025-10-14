"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import IncidentFormMinimal, { MinimalIncidentForm } from "@/components/safety/IncidentFormMinimal"
import { saveIncident } from "@/lib/incidents-min"

export default function NewIncidentPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="mx-auto max-w-3xl p-6">
      <IncidentFormMinimal
        submitting={submitting}
        onSubmit={async (values: MinimalIncidentForm) => {
          setSubmitting(true)
          try {
            const id = await saveIncident(values)
            router.push(`/incidents/${id}`) // adjust route to your needs
          } catch (e) {
            console.error(e)
            alert("Failed to save incident")
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </div>
  )
}
