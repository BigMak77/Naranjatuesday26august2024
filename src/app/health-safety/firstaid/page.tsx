"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function FirstAidPage() {
  const [form, setForm] = useState({
    patient: "",
    date: "",
    treatment: "",
    administeredBy: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    // Save to supabase (replace 'first_aid_treatments' with your table name)
    const { error } = await supabase.from("first_aid_treatments").insert([
      {
        patient: form.patient,
        date: form.date,
        treatment: form.treatment,
        administered_by: form.administeredBy,
        notes: form.notes,
      },
    ]);
    setSubmitting(false);
    if (error) setError("Failed to record treatment.");
    else {
      setSuccess(true);
      setForm({
        patient: "",
        date: "",
        treatment: "",
        administeredBy: "",
        notes: "",
      });
    }
  };

  return (
    <main className="first-aid-main">
      <div className="first-aid-container">
        <form onSubmit={handleSubmit} className="first-aid-form">
          <div>
            <label className="first-aid-label">Patient Name</label>
            <input
              name="patient"
              value={form.patient}
              onChange={handleChange}
              className="first-aid-input"
              required
            />
          </div>
          <div>
            <label className="first-aid-label">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="first-aid-input"
              required
            />
          </div>
          <div>
            <label className="first-aid-label">Treatment Given</label>
            <input
              name="treatment"
              value={form.treatment}
              onChange={handleChange}
              className="first-aid-input"
              required
            />
          </div>
          <div>
            <label className="first-aid-label">Administered By</label>
            <input
              name="administeredBy"
              value={form.administeredBy}
              onChange={handleChange}
              className="first-aid-input"
              required
            />
          </div>
          <div>
            <label className="first-aid-label">Notes (optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="first-aid-input"
              rows={3}
            />
          </div>
          {error && <p className="first-aid-error-msg">{error}</p>}
          {success && (
            <p className="first-aid-success-msg">
              Treatment recorded successfully!
            </p>
          )}
          <button
            type="submit"
            className="neon-btn neon-btn-firstaid first-aid-submit-btn"
            data-variant="firstaid"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span style={{ marginRight: "0.5em" }}>Recording...</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-activity"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </>
            ) : (
              <>
                <span style={{ marginRight: "0.5em" }}>Record Treatment</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-activity"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </>
            )}
          </button>
          {/* TODO: Add first aid reports page at /health-safety/firstaid/reports */}
          {/* <button
            type="button"
            className="neon-btn neon-btn-reports first-aid-reports-btn"
            data-variant="reports"
            style={{ marginTop: "1rem" }}
            onClick={() => (window.location.href = "/health-safety/firstaid/reports")}
          >
            <span style={{ marginRight: "0.5em" }}>View Reports</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-file-text"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          </button> */}
        </form>
      </div>
    </main>
  );
}
