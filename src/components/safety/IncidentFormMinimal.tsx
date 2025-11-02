"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";

export type MinimalIncidentForm = {
  incidentType: string;
  severity: string;
  occurredDate: string;
  occurredTime: string;
  site: string;
  area?: string;
  zone?: string;
  description: string;
  immediateAction?: string;
  personsInvolved: string[]; // array of auth_id
  witnesses: string[]; // array of auth_id
  weatherConditions?: string;
  temperature?: number;
  visibility?: string;
  // Injury-specific fields
  injuryType?: string;
  bodyPartAffected?: string;
  treatmentGiven?: string;
  // Property damage fields
  equipmentDamaged?: string;
  estimatedCost?: number;
};

interface User {
  auth_id: string;
  name: string;
}

interface Location {
  id: string;
  site: string;
  area: string | null;
  zone: string | null;
}

export default function IncidentFormMinimal(props: {
  onSubmit: (data: MinimalIncidentForm) => Promise<void> | void;
  defaultValues?: Partial<MinimalIncidentForm>;
  submitting?: boolean;
}) {
  const { onSubmit, defaultValues, submitting = false } = props;
  const [error, setError] = useState<string | null>(null);
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [personsInvolved, setPersonsInvolved] = useState<string[]>(defaultValues?.personsInvolved || []);
  const [witnesses, setWitnesses] = useState<string[]>(defaultValues?.witnesses || []);
  const [loading, setLoading] = useState(true);

  // Location state
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>(defaultValues?.site || "");
  const [selectedArea, setSelectedArea] = useState<string>(defaultValues?.area || "");
  const [selectedZone, setSelectedZone] = useState<string>(defaultValues?.zone || "");

  // Derived options
  const sites = Array.from(new Set(locations.map(l => l.site))).sort();
  const areas = Array.from(new Set(
    locations
      .filter(l => l.site === selectedSite && l.area)
      .map(l => l.area!)
  )).sort();
  const zones = Array.from(new Set(
    locations
      .filter(l => l.site === selectedSite && l.area === selectedArea && l.zone)
      .map(l => l.zone!)
  )).sort();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Omit<MinimalIncidentForm, 'personsInvolved' | 'witnesses' | 'area' | 'zone'>>({
    defaultValues: {
      incidentType: defaultValues?.incidentType || "injury",
      severity: defaultValues?.severity || "low",
      occurredDate: defaultValues?.occurredDate || new Date().toISOString().slice(0, 10),
      occurredTime: defaultValues?.occurredTime || new Date().toISOString().slice(11, 16),
      site: defaultValues?.site || "",
      description: defaultValues?.description || "",
      immediateAction: defaultValues?.immediateAction || "",
      weatherConditions: defaultValues?.weatherConditions || "",
      temperature: defaultValues?.temperature || undefined,
      visibility: defaultValues?.visibility || "",
      injuryType: defaultValues?.injuryType || "",
      bodyPartAffected: defaultValues?.bodyPartAffected || "",
      treatmentGiven: defaultValues?.treatmentGiven || "",
      equipmentDamaged: defaultValues?.equipmentDamaged || "",
      estimatedCost: defaultValues?.estimatedCost || undefined,
    },
    mode: "onBlur",
  });

  const watchedIncidentType = watch("incidentType");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("auth_id, first_name, last_name");
        
        if (usersError) throw usersError;
        
        if (usersData) {
          const validUsers = usersData
            .filter((u) => u.auth_id && u.auth_id.trim() !== '')
            .map((u) => ({
              auth_id: u.auth_id,
              name: [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || "Unknown User",
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          
          setUserOptions(validUsers);
        }

        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from("locations")
          .select("id, site, area, zone")
          .eq("is_active", true)
          .order("site")
          .order("area")
          .order("zone");
        
        if (locationsError) throw locationsError;
        
        if (locationsData) {
          setLocations(locationsData);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const submit = async (data: Omit<MinimalIncidentForm, 'personsInvolved' | 'witnesses' | 'area' | 'zone'>) => {
    console.log("Form submit triggered", data);
    setError(null);

    if (!selectedSite) {
      setError("Please select a site");
      return;
    }

    if (personsInvolved.length === 0) {
      setError("Please select at least one person involved");
      return;
    }

    try {
      const fullData: MinimalIncidentForm = {
        ...data,
        site: selectedSite,
        area: selectedArea || undefined,
        zone: selectedZone || undefined,
        personsInvolved,
        witnesses,
        weatherConditions: data.weatherConditions || undefined,
        temperature: data.temperature || undefined,
        visibility: data.visibility || undefined,
        immediateAction: data.immediateAction || undefined,
        injuryType: data.injuryType || undefined,
        bodyPartAffected: data.bodyPartAffected || undefined,
        treatmentGiven: data.treatmentGiven || undefined,
        equipmentDamaged: data.equipmentDamaged || undefined,
        estimatedCost: data.estimatedCost || undefined,
      };
      console.log("Submitting full data:", fullData);
      await onSubmit(fullData);
      console.log("Form submitted successfully");
    } catch (e: any) {
      console.error("Form submission error:", e);
      setError(e?.message ?? "Failed to submit");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text)" }}>
        Loading form...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{
        fontSize: "1.5rem",
        fontWeight: "600",
        color: "var(--neon)",
        marginTop: 0,
        marginBottom: "0.5rem"
      }}>
        Accident / Incident Report
      </h2>
      <p style={{ color: "var(--text-white)", fontSize: "0.875rem", marginBottom: "2rem", opacity: 0.8 }}>
        Complete all required fields marked with *. This form will be reviewed by the Health & Safety team.
      </p>

      {error && (
        <div style={{
          marginBottom: "1.5rem",
          padding: "0.75rem",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          color: "#ef4444"
        }}>
          {error}
        </div>
      )}

      {/* Section 1: Basic Information */}
      <fieldset style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        background: "rgba(5, 54, 57, 0.3)"
      }}>
        <legend style={{
          color: "var(--neon)",
          fontWeight: "700",
          fontSize: "1rem",
          padding: "0 0.5rem"
        }}>
          Basic Information
        </legend>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label htmlFor="incidentType" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Incident Type *
            </label>
            <select
              id="incidentType"
              className="neon-input"
              aria-invalid={!!errors.incidentType}
              {...register("incidentType", { required: "Select a type" })}
            >
              <option value="injury">Injury / Illness</option>
              <option value="near_miss">Near Miss</option>
              <option value="property_damage">Property Damage</option>
              <option value="environmental">Environmental</option>
              <option value="security">Security</option>
              <option value="fire">Fire</option>
              <option value="other">Other</option>
            </select>
            {errors.incidentType && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {errors.incidentType.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="severity" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Severity *
            </label>
            <select
              id="severity"
              className="neon-input"
              aria-invalid={!!errors.severity}
              {...register("severity", { required: "Select severity" })}
            >
              <option value="low">Low - Minor incident</option>
              <option value="medium">Medium - Requires attention</option>
              <option value="high">High - Serious incident</option>
              <option value="critical">Critical - Major incident</option>
            </select>
            {errors.severity && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {errors.severity.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="occurredDate" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Date Occurred *
            </label>
            <input
              id="occurredDate"
              type="date"
              className="neon-input"
              aria-invalid={!!errors.occurredDate}
              {...register("occurredDate", { required: "Date is required" })}
            />
            {errors.occurredDate && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {errors.occurredDate.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="occurredTime" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Time Occurred *
            </label>
            <input
              id="occurredTime"
              type="time"
              className="neon-input"
              aria-invalid={!!errors.occurredTime}
              {...register("occurredTime", { required: "Time is required" })}
            />
            {errors.occurredTime && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {errors.occurredTime.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Section 2: Location */}
      <fieldset style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        background: "rgba(5, 54, 57, 0.3)"
      }}>
        <legend style={{
          color: "var(--neon)",
          fontWeight: "700",
          fontSize: "1rem",
          padding: "0 0.5rem"
        }}>
          Location
        </legend>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <div>
            <label htmlFor="site" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Site *
            </label>
            <select
              id="site"
              className="neon-input"
              value={selectedSite}
              onChange={(e) => {
                setSelectedSite(e.target.value);
                setSelectedArea("");
                setSelectedZone("");
              }}
              required
            >
              <option value="">— Select Site —</option>
              {sites.map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
            {!selectedSite && (
              <p style={{ color: "#f59e0b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Required
              </p>
            )}
          </div>

          <div>
            <label htmlFor="area" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Area
            </label>
            <select
              id="area"
              className="neon-input"
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setSelectedZone("");
              }}
              disabled={!selectedSite || areas.length === 0}
            >
              <option value="">— Select Area —</option>
              {areas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="zone" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Zone
            </label>
            <select
              id="zone"
              className="neon-input"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              disabled={!selectedArea || zones.length === 0}
            >
              <option value="">— Select Zone —</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Section 3: Incident Details */}
      <fieldset style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        background: "rgba(5, 54, 57, 0.3)"
      }}>
        <legend style={{
          color: "var(--neon)",
          fontWeight: "700",
          fontSize: "1rem",
          padding: "0 0.5rem"
        }}>
          Incident Details
        </legend>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="description" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
            Description *
          </label>
          <textarea
            id="description"
            rows={5}
            className="neon-input"
            style={{ height: "auto", minHeight: "100px" }}
            placeholder="Describe what happened in detail..."
            aria-invalid={!!errors.description}
            {...register("description", {
              required: "Description is required",
              minLength: { value: 10, message: "Please provide at least 10 characters" },
            })}
          />
          {errors.description && (
            <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="immediateAction" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
            Immediate Action Taken
          </label>
          <textarea
            id="immediateAction"
            rows={3}
            className="neon-input"
            style={{ height: "auto", minHeight: "70px" }}
            placeholder="Describe any immediate actions taken following the incident..."
            {...register("immediateAction")}
          />
        </div>
      </fieldset>

      {/* Section 4: Injury Details (conditional) */}
      {watchedIncidentType === "injury" && (
        <fieldset style={{
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          background: "rgba(5, 54, 57, 0.3)"
        }}>
          <legend style={{
            color: "var(--neon)",
            fontWeight: "700",
            fontSize: "1rem",
            padding: "0 0.5rem"
          }}>
            Injury Details
          </legend>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label htmlFor="injuryType" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
                Type of Injury
              </label>
              <select
                id="injuryType"
                className="neon-input"
                {...register("injuryType")}
              >
                <option value="">— Select Type —</option>
                <option value="cut">Cut / Laceration</option>
                <option value="bruise">Bruise / Contusion</option>
                <option value="burn">Burn</option>
                <option value="sprain">Sprain / Strain</option>
                <option value="fracture">Fracture</option>
                <option value="head_injury">Head Injury</option>
                <option value="eye_injury">Eye Injury</option>
                <option value="chemical_exposure">Chemical Exposure</option>
                <option value="electrical">Electrical Shock</option>
                <option value="illness">Illness</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="bodyPartAffected" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
                Body Part Affected
              </label>
              <input
                id="bodyPartAffected"
                type="text"
                className="neon-input"
                placeholder="e.g., Left hand, Right ankle"
                {...register("bodyPartAffected")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="treatmentGiven" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Treatment Given
            </label>
            <textarea
              id="treatmentGiven"
              rows={3}
              className="neon-input"
              style={{ height: "auto", minHeight: "70px" }}
              placeholder="Describe first aid or medical treatment provided..."
              {...register("treatmentGiven")}
            />
          </div>
        </fieldset>
      )}

      {/* Section 5: Property Damage Details (conditional) */}
      {watchedIncidentType === "property_damage" && (
        <fieldset style={{
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          background: "rgba(5, 54, 57, 0.3)"
        }}>
          <legend style={{
            color: "var(--neon)",
            fontWeight: "700",
            fontSize: "1rem",
            padding: "0 0.5rem"
          }}>
            Property Damage Details
          </legend>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="equipmentDamaged" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Equipment / Property Damaged
            </label>
            <textarea
              id="equipmentDamaged"
              rows={3}
              className="neon-input"
              style={{ height: "auto", minHeight: "70px" }}
              placeholder="Describe the equipment or property that was damaged..."
              {...register("equipmentDamaged")}
            />
          </div>

          <div>
            <label htmlFor="estimatedCost" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Estimated Repair Cost (£)
            </label>
            <input
              id="estimatedCost"
              type="number"
              step="0.01"
              min="0"
              className="neon-input"
              placeholder="0.00"
              {...register("estimatedCost", {
                valueAsNumber: true,
                min: { value: 0, message: "Cost cannot be negative" },
              })}
            />
            {errors.estimatedCost && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {errors.estimatedCost.message}
              </p>
            )}
          </div>
        </fieldset>
      )}

      {/* Section 6: Environmental Conditions */}
      <fieldset style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        background: "rgba(5, 54, 57, 0.3)"
      }}>
        <legend style={{
          color: "var(--neon)",
          fontWeight: "700",
          fontSize: "1rem",
          padding: "0 0.5rem"
        }}>
          Environmental Conditions
        </legend>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <label htmlFor="weatherConditions" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Weather Conditions
            </label>
            <select
              id="weatherConditions"
              className="neon-input"
              {...register("weatherConditions")}
            >
              <option value="">— Select —</option>
              <option value="clear">Clear / Sunny</option>
              <option value="cloudy">Cloudy</option>
              <option value="overcast">Overcast</option>
              <option value="light_rain">Light Rain</option>
              <option value="heavy_rain">Heavy Rain</option>
              <option value="drizzle">Drizzle</option>
              <option value="fog">Fog / Mist</option>
              <option value="snow">Snow</option>
              <option value="sleet">Sleet</option>
              <option value="windy">Windy</option>
              <option value="storm">Storm / Severe Weather</option>
              <option value="hot">Hot / Heat Wave</option>
              <option value="cold">Cold / Freezing</option>
            </select>
          </div>

          <div>
            <label htmlFor="temperature" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Temperature (°C)
            </label>
            <input
              id="temperature"
              type="number"
              step="0.1"
              className="neon-input"
              placeholder="e.g. 22"
              {...register("temperature", {
                valueAsNumber: true,
                min: { value: -50, message: "Invalid temperature" },
                max: { value: 60, message: "Invalid temperature" },
              })}
            />
            {errors.temperature && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {errors.temperature.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="visibility" style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Visibility
            </label>
            <select
              id="visibility"
              className="neon-input"
              {...register("visibility")}
            >
              <option value="">— Select —</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="moderate">Moderate</option>
              <option value="poor">Poor</option>
              <option value="very_poor">Very Poor</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Section 7: People Involved */}
      <fieldset style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        background: "rgba(5, 54, 57, 0.3)"
      }}>
        <legend style={{
          color: "var(--neon)",
          fontWeight: "700",
          fontSize: "1rem",
          padding: "0 0.5rem"
        }}>
          People Involved
        </legend>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Persons Involved *
            </label>
            <SearchableMultiSelect
              options={userOptions}
              selected={personsInvolved}
              onChange={setPersonsInvolved}
              labelKey="name"
              valueKey="auth_id"
              placeholder="Search for persons involved..."
            />
            {personsInvolved.length === 0 && (
              <p style={{ color: "#f59e0b", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Select at least one person
              </p>
            )}
          </div>

          <div>
            <label style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Witnesses
            </label>
            <SearchableMultiSelect
              options={userOptions}
              selected={witnesses}
              onChange={setWitnesses}
              labelKey="name"
              valueKey="auth_id"
              placeholder="Search for witnesses..."
            />
          </div>
        </div>
      </fieldset>

      {/* Actions */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        paddingTop: "1.5rem",
        borderTop: "2px solid var(--border)",
        marginTop: "2rem"
      }}>
        <p style={{
          color: "var(--text-white)",
          fontSize: "0.875rem",
          opacity: 0.7,
          margin: 0
        }}>
          All reports are confidential and will be reviewed by the Health & Safety team
        </p>
        <button
          type="submit"
          disabled={submitting || personsInvolved.length === 0 || !selectedSite}
          className="neon-btn neon-btn-save"
          title={submitting ? "Submitting..." : "Submit Report"}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: submitting || personsInvolved.length === 0 || !selectedSite ? "not-allowed" : "pointer",
            opacity: submitting || personsInvolved.length === 0 || !selectedSite ? 0.5 : 1
          }}
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </form>
  );
}
