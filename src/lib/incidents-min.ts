import { supabase } from "@/lib/supabase-client"
import type { MinimalIncidentForm } from "@/components/healthsafety/IncidentFormMinimal"

export async function saveIncident(values: MinimalIncidentForm) {
  const occurredAtISO = `${values.occurredDate}T${values.occurredTime}:00Z` // simple UTC

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be logged in to submit an incident");
  }

  // Find the location_id based on site/area/zone
  let location_id = null;
  if (values.site) {
    const { data: locationData } = await supabase
      .from("locations")
      .select("id")
      .eq("site", values.site)
      .eq("area", values.area || null)
      .eq("zone", values.zone || null)
      .maybeSingle();
    
    location_id = locationData?.id || null;
  }

  const { data: incident, error: insertErr } = await supabase
    .from("incidents")
    .insert({
      incident_type: values.incidentType,
      severity: values.severity,
      description: values.description,
      immediate_action: values.immediateAction || null,
      site: values.site,
      area: values.area || null,
      zone: values.zone || null,
      location_id: location_id,
      occurred_date: values.occurredDate,
      occurred_time: values.occurredTime,
      occurred_at: occurredAtISO,
      persons_involved: values.personsInvolved || [],
      witnesses: values.witnesses || [],
      weather_conditions: values.weatherConditions || null,
      temperature: values.temperature || null,
      visibility: values.visibility || null,
      injury_type: values.injuryType || null,
      body_part_affected: values.bodyPartAffected || null,
      treatment_given: values.treatmentGiven || null,
      equipment_damaged: values.equipmentDamaged || null,
      estimated_cost: values.estimatedCost || null,
      reported_by: user.id,
      status: "open",
    })
    .select()
    .single()

  if (insertErr) throw insertErr

  return incident.id as string
}
