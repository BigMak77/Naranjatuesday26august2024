"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonIconButton from "@/components/ui/NeonIconButton";
import MultiselectCheckboxes from "@/components/ui/MultiselectCheckboxes";

export type MinimalIncidentForm = {
  incidentType: string;
  occurredDate: string;
  occurredTime: string;
  site: string;
  description: string;
  persons: { auth_id: string; injured?: boolean }[];
  witnesses: string[]; // array of auth_id
};

export default function IncidentFormMinimal(props: {
  onSubmit: (data: MinimalIncidentForm) => Promise<void> | void;
  defaultValues?: Partial<MinimalIncidentForm>;
  submitting?: boolean;
}) {
  const { onSubmit, defaultValues, submitting = false } = props;
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MinimalIncidentForm>({
    defaultValues: {
      incidentType: "injury",
      occurredDate: new Date().toISOString().slice(0, 10),
      occurredTime: new Date().toISOString().slice(11, 16),
      site: "",
      description: "",
      persons: [{ auth_id: "", injured: false }],
      witnesses: [],
      ...defaultValues,
    },
    mode: "onBlur",
  });

  const persons = useFieldArray({ control, name: "persons" });

  const [userOptions, setUserOptions] = useState<{ auth_id: string; name: string }[]>([]);
  const [witnesses, setWitnesses] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from("users")
        .select("auth_id, first_name, last_name");
      if (!error && data) {
        setUserOptions(
          data.map((u) => ({
            auth_id: u.auth_id,
            name: [u.first_name, u.last_name].filter(Boolean).join(" "),
          }))
        );
      }
    }
    fetchUsers();
  }, []);

  const submit = async (data: MinimalIncidentForm) => {
    setError(null);
    try {
      await onSubmit({ ...data, witnesses });
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="neon-form incident-form-global space-y-6"
    >
      <h2 className="text-2xl font-semibold">
        Accident / Incident Report (Minimal)
      </h2>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Incident basics */}
      <div className="incident-form-basics">
        <div className="incident-form-row">
          <div className="incident-form-field">
            <label htmlFor="incidentType">Incident Type *</label>
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
              <p className="form-error">{errors.incidentType.message}</p>
            )}
          </div>
          <div className="incident-form-field">
            <label htmlFor="occurredDate">Date *</label>
            <input
              id="occurredDate"
              type="date"
              className="neon-input"
              aria-invalid={!!errors.occurredDate}
              {...register("occurredDate", { required: "Date is required" })}
            />
            {errors.occurredDate && (
              <p className="form-error">{errors.occurredDate.message}</p>
            )}
          </div>
          <div className="incident-form-field">
            <label htmlFor="occurredTime">Time *</label>
            <input
              id="occurredTime"
              type="time"
              className="neon-input"
              aria-invalid={!!errors.occurredTime}
              {...register("occurredTime", { required: "Time is required" })}
            />
            {errors.occurredTime && (
              <p className="form-error">{errors.occurredTime.message}</p>
            )}
          </div>
          <div className="incident-form-field">
            <label htmlFor="site">Site *</label>
            <input
              id="site"
              className="neon-input"
              placeholder="e.g., London Depot"
              aria-invalid={!!errors.site}
              {...register("site", { required: "Site is required" })}
            />
            {errors.site && (
              <p className="form-error">{errors.site.message}</p>
            )}
          </div>
        </div>
        <div className="incident-form-description">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            rows={4}
            className="neon-input"
            placeholder="What happened?"
            aria-invalid={!!errors.description}
            {...register("description", {
              required: "Description is required",
              minLength: { value: 10, message: "Please add more detail" },
            })}
          />
          {errors.description && (
            <p className="form-error">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* People involved */}
      <div className="incident-people-row">
        <MultiselectCheckboxes
          options={userOptions}
          selected={persons.fields.map(p => p.auth_id)}
          onChange={(selected: string[]) => {
            // Add new selected users
            selected.forEach((auth_id: string) => {
              if (!persons.fields.some(p => p.auth_id === auth_id)) {
                persons.append({ auth_id, injured: false });
              }
            });
            // Remove unselected users (reverse order to avoid index mutation)
            for (let i = persons.fields.length - 1; i >= 0; i--) {
              if (!selected.includes(persons.fields[i].auth_id)) {
                persons.remove(i);
              }
            }
          }}
          labelKey="name"
          valueKey="auth_id"
          className="incident-people-list"
        />
        <MultiselectCheckboxes
          options={userOptions}
          selected={witnesses}
          onChange={(selected: string[]) => setWitnesses(selected)}
          labelKey="name"
          valueKey="auth_id"
          className="incident-witness-list"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </form>
  );
}
