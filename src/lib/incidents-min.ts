import { supabase } from "@/lib/supabase-client"
import type { MinimalIncidentForm } from "@/components/safety/IncidentFormMinimal"

export async function saveIncident(values: MinimalIncidentForm) {
  const occurredAtISO = `${values.occurredDate}T${values.occurredTime}:00Z` // simple UTC

  const { data: incident, error: insertErr } = await supabase
    .from("incidents")
    .insert({
      incident_type: values.incidentType,
      description: values.description,
      site: values.site,
      occurred_at: occurredAtISO,
    })
    .select()
    .single()

  if (insertErr) throw insertErr

  const people = values.persons ?? []
  if (people.length) {
    const rows = people.map(p => ({
      incident_id: incident.id,
      full_name: p.auth_id, // fallback to auth_id since fullName does not exist
      injured: !!p.injured,
    }))
    const { error: pplErr } = await supabase.from("incident_persons").insert(rows)
    if (pplErr) throw pplErr
  }

  return incident.id as string
}
