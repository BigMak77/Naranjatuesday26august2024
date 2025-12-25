"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";
import TextIconButton from "@/components/ui/TextIconButtons";

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
      <div className="loading-container">
        Loading form...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="incident-form">
      <header className="form-header">
        <h2 className="form-title">
          Accident / Incident Report
        </h2>
        <p className="form-subtitle">
          Complete all required fields marked with *. This form will be reviewed by the Health & Safety team.
        </p>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {/* Section 1: Basic Information */}
      <section className="form-section">
        <h3 className="section-title">Basic Information</h3>
        
        <div className="form-grid form-grid-4">
          <div className="form-field">
            <label htmlFor="incidentType" className="form-label required">
              Incident Type
            </label>
            <select
              id="incidentType"
              className="form-input"
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
              <p className="field-error">
                {errors.incidentType.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="severity" className="form-label required">
              Severity
            </label>
            <select
              id="severity"
              className="form-input"
              aria-invalid={!!errors.severity}
              {...register("severity", { required: "Select severity" })}
            >
              <option value="low">Low - Minor incident</option>
              <option value="medium">Medium - Requires attention</option>
              <option value="high">High - Serious incident</option>
              <option value="critical">Critical - Major incident</option>
            </select>
            {errors.severity && (
              <p className="field-error">
                {errors.severity.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="occurredDate" className="form-label required">
              Date Occurred
            </label>
            <input
              id="occurredDate"
              type="date"
              className="form-input"
              aria-invalid={!!errors.occurredDate}
              {...register("occurredDate", { required: "Date is required" })}
            />
            {errors.occurredDate && (
              <p className="field-error">
                {errors.occurredDate.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="occurredTime" className="form-label required">
              Time Occurred
            </label>
            <input
              id="occurredTime"
              type="time"
              className="form-input"
              aria-invalid={!!errors.occurredTime}
              {...register("occurredTime", { required: "Time is required" })}
            />
            {errors.occurredTime && (
              <p className="field-error">
                {errors.occurredTime.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Location */}
      <section className="form-section">
        <h3 className="section-title">Location</h3>
        
        <div className="form-grid form-grid-3">
          <div className="form-field">
            <label htmlFor="site" className="form-label required">
              Site
            </label>
            <select
              id="site"
              className="form-input"
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
              <p className="field-warning">
                Required
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="area" className="form-label">
              Area
            </label>
            <select
              id="area"
              className="form-input"
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

          <div className="form-field">
            <label htmlFor="zone" className="form-label">
              Zone
            </label>
            <select
              id="zone"
              className="form-input"
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
      </section>

      {/* Section 3: Incident Details */}
      <section className="form-section">
        <h3 className="section-title">Incident Details</h3>
        
        <div className="form-field">
          <label htmlFor="description" className="form-label required">
            Description
          </label>
          <textarea
            id="description"
            rows={5}
            className="form-input"
            placeholder="Describe what happened in detail..."
            aria-invalid={!!errors.description}
            {...register("description", {
              required: "Description is required",
              minLength: { value: 10, message: "Please provide at least 10 characters" },
            })}
          />
          {errors.description && (
            <p className="field-error">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="immediateAction" className="form-label">
            Immediate Action Taken
          </label>
          <textarea
            id="immediateAction"
            rows={3}
            className="form-input"
            placeholder="Describe any immediate actions taken following the incident..."
            {...register("immediateAction")}
          />
        </div>
      </section>

      {/* Section 4: Injury Details (conditional) */}
      {watchedIncidentType === "injury" && (
        <section className="form-section">
          <h3 className="section-title">Injury Details</h3>
          
          <div className="form-grid form-grid-2">
            <div className="form-field">
              <label htmlFor="injuryType" className="form-label">
                Type of Injury
              </label>
              <select
                id="injuryType"
                className="form-input"
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

            <div className="form-field">
              <label htmlFor="bodyPartAffected" className="form-label">
                Body Part Affected
              </label>
              <input
                id="bodyPartAffected"
                type="text"
                className="form-input"
                placeholder="e.g., Left hand, Right ankle"
                {...register("bodyPartAffected")}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="treatmentGiven" className="form-label">
              Treatment Given
            </label>
            <textarea
              id="treatmentGiven"
              rows={3}
              className="form-input"
              placeholder="Describe first aid or medical treatment provided..."
              {...register("treatmentGiven")}
            />
          </div>
        </section>
      )}

      {/* Section 5: Property Damage Details (conditional) */}
      {watchedIncidentType === "property_damage" && (
        <section className="form-section">
          <h3 className="section-title">Property Damage Details</h3>
          
          <div className="form-field">
            <label htmlFor="equipmentDamaged" className="form-label">
              Equipment / Property Damaged
            </label>
            <textarea
              id="equipmentDamaged"
              rows={3}
              className="form-input"
              placeholder="Describe the equipment or property that was damaged..."
              {...register("equipmentDamaged")}
            />
          </div>

          <div className="form-field">
            <label htmlFor="estimatedCost" className="form-label">
              Estimated Repair Cost (£)
            </label>
            <input
              id="estimatedCost"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0.00"
              {...register("estimatedCost", {
                valueAsNumber: true,
                min: { value: 0, message: "Cost cannot be negative" },
              })}
            />
            {errors.estimatedCost && (
              <p className="field-error">
                {errors.estimatedCost.message}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Section 6: Environmental Conditions */}
      <section className="form-section">
        <h3 className="section-title">Environmental Conditions</h3>
        
        <div className="form-grid form-grid-env">
          <div className="form-field">
            <label htmlFor="weatherConditions" className="form-label">
              Weather Conditions
            </label>
            <select
              id="weatherConditions"
              className="form-input"
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

          <div className="form-field">
            <label htmlFor="temperature" className="form-label">
              Temperature (°C)
            </label>
            <input
              id="temperature"
              type="number"
              step="0.1"
              className="form-input"
              placeholder="e.g. 22"
              {...register("temperature", {
                valueAsNumber: true,
                min: { value: -50, message: "Invalid temperature" },
                max: { value: 60, message: "Invalid temperature" },
              })}
            />
            {errors.temperature && (
              <p className="field-error">
                {errors.temperature.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="visibility" className="form-label">
              Visibility
            </label>
            <select
              id="visibility"
              className="form-input"
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
      </section>

      {/* Section 7: People Involved */}
      <section className="form-section">
        <h3 className="section-title">People Involved</h3>
        
        <div className="form-grid form-grid-people">
          <div className="form-field">
            <label className="form-label required">
              Persons Involved
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
              <p className="field-info">
                Select at least one person
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label">
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
      </section>

      {/* Actions */}
      <footer className="form-actions">
        <p className="form-actions-text">
          All reports are confidential and will be reviewed by the Health & Safety team
        </p>
        <TextIconButton
          type="submit"
          variant="save"
          label={submitting ? "Submitting..." : "Submit Report"}
          disabled={submitting || personsInvolved.length === 0 || !selectedSite}
          onClick={() => {}}
        />
      </footer>
    </form>
  );
}
