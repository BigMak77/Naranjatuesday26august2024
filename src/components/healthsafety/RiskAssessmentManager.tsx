"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiClipboard, FiUserPlus } from "react-icons/fi";
import NeonForm from "@/components/NeonForm";
import NeonTable from "@/components/NeonTable";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";
import OverlayDialog from "@/components/ui/OverlayDialog";

type TurkusRisk = {
  id: string;
  title: string;
  description: string;
  severity: string;
  likelihood: number; // 1-5 scale
  risk_rating: number; // Calculated: severity_numeric × likelihood
  created_at: string;
  review_period_months: number;
  department_id: string | null;
  category_id: string | null;
  created_by: string | null;
  photo_urls: string[] | null;
  control_measures?: string;
  persons_at_risk?: string;
  injury_risk?: string;
};

type Department = {
  id: string;
  name: string;
};

type User = {
  id: string;
  auth_id: string;
  email: string;
  department_id: string | null;
};

export default function RiskAssessmentManager() {
  const [mode, setMode] = useState<"list" | "create" | "edit" | "assign">(
    "list",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [riskAssessments, setRiskAssessments] = useState<TurkusRisk[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);
  const [assignUserId, setAssignUserId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [likelihood, setLikelihood] = useState(3); // 1-5 scale
  const [reviewPeriod, setReviewPeriod] = useState(12);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [controlMeasures, setControlMeasures] = useState("");
  const [personsAtRisk, setPersonsAtRisk] = useState("");
  const [injuryRisk, setInjuryRisk] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: risks }, { data: depts }] = await Promise.all([
        supabase
          .from("turkus_risks")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("departments").select("id, name").order("name"),
      ]);
      setRiskAssessments(risks || []);
      setDepartments(depts || []);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (mode === "edit" && selectedId) {
      const selected = riskAssessments.find((r) => r.id === selectedId);
      if (selected) {
        setTitle(selected.title);
        setDescription(selected.description);
        setSeverity(selected.severity);
        setLikelihood(selected.likelihood || 3);
        setReviewPeriod(selected.review_period_months);
        setDepartmentId(selected.department_id);
        setPhotoUrls(selected.photo_urls || []);
        setControlMeasures(selected.control_measures || "");
        setPersonsAtRisk(selected.persons_at_risk || "");
        setInjuryRisk(selected.injury_risk || "");
      }
    }
  }, [mode, selectedId, riskAssessments]);

  useEffect(() => {
    if (mode === "assign" && selectedId) {
      const selected = riskAssessments.find((r) => r.id === selectedId);
      if (!selected?.department_id) return;

      supabase
        .from("users")
        .select("id, auth_id, email, department_id")
        .eq("department_id", selected.department_id)
        .then(({ data }) => setDepartmentUsers(data || []));
    }
  }, [mode, selectedId, riskAssessments]);

  // Helper functions for risk calculation
  const getSeverityNumeric = (sev: string): number => {
    switch (sev) {
      case "Low":
        return 1;
      case "Medium":
        return 3;
      case "High":
        return 4;
      case "Critical":
        return 5;
      default:
        return 3;
    }
  };

  const calculateRiskRating = (sev: string, like: number): number => {
    return getSeverityNumeric(sev) * like;
  };

  const getRiskLevel = (rating: number): string => {
    if (rating <= 5) return "Low";
    if (rating <= 12) return "Medium";
    if (rating <= 16) return "High";
    return "Critical";
  };

  const getRiskColor = (rating: number): string => {
    if (rating <= 5) return "#00ff00"; // Green
    if (rating <= 12) return "#ffff00"; // Yellow
    if (rating <= 16) return "#ff9900"; // Orange
    return "#ff0000"; // Red
  };

  const getLikelihoodLabel = (like: number): string => {
    switch (like) {
      case 1:
        return "Rare";
      case 2:
        return "Unlikely";
      case 3:
        return "Possible";
      case 4:
        return "Likely";
      case 5:
        return "Almost Certain";
      default:
        return "Unknown";
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSeverity("Medium");
    setLikelihood(3);
    setReviewPeriod(12);
    setDepartmentId(null);
    setPhotoUrls([]);
    setControlMeasures("");
    setPersonsAtRisk("");
    setInjuryRisk("");
  };

  const handleCancel = () => {
    resetForm();
    setMode("list");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      severity,
      likelihood,
      review_period_months: reviewPeriod,
      department_id: departmentId,
      photo_urls: photoUrls,
      control_measures: controlMeasures,
      persons_at_risk: personsAtRisk,
      injury_risk: injuryRisk,
      created_by: null,
    };

    const query =
      mode === "create"
        ? supabase.from("turkus_risks").insert(payload)
        : supabase.from("turkus_risks").update(payload).eq("id", selectedId);

    const { error } = await query;
    if (!error) {
      resetForm();
      setMode("list");
      const { data } = await supabase.from("turkus_risks").select("*");
      setRiskAssessments(data || []);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "24px",
        padding: "16px",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        borderRadius: "8px"
      }}>
        <h2 className="neon-form-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <FiClipboard /> Risk Assessments
        </h2>
        <NeonIconButton
          variant="add"
          title="Create New"
          onClick={() => {
            resetForm();
            setMode("create");
            setSelectedId(null);
          }}
        />
      </div>

      {mode === "list" && (
        <>
          {/* Risk Matrix Visualization */}
          <div style={{
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            border: "1px solid #00ffff",
            borderRadius: "8px"
          }}>
            <h3 style={{ color: "#00ffff", marginBottom: "16px", fontSize: "1.1em" }}>
              Risk Matrix
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "4px",
                fontSize: "0.85em",
                tableLayout: "fixed"
              }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px", textAlign: "center", color: "#00ffff", width: "140px" }}>
                      Likelihood →<br/>Severity ↓
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", color: "#00ffff", width: "calc((100% - 140px) / 5)" }}>
                      1<br/>Rare
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", color: "#00ffff", width: "calc((100% - 140px) / 5)" }}>
                      2<br/>Unlikely
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", color: "#00ffff", width: "calc((100% - 140px) / 5)" }}>
                      3<br/>Possible
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", color: "#00ffff", width: "calc((100% - 140px) / 5)" }}>
                      4<br/>Likely
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", color: "#00ffff", width: "calc((100% - 140px) / 5)" }}>
                      5<br/>Almost Certain
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {["Critical", "High", "Medium", "Low"].map((sev) => (
                    <tr key={sev}>
                      <td style={{ padding: "8px", fontWeight: "bold", color: "#00ffff" }}>
                        {getSeverityNumeric(sev)} - {sev}
                      </td>
                      {[1, 2, 3, 4, 5].map((like) => {
                        const rating = getSeverityNumeric(sev) * like;
                        const color = getRiskColor(rating);
                        const count = riskAssessments.filter(
                          (r) => r.severity === sev && (r.likelihood || 3) === like
                        ).length;
                        return (
                          <td
                            key={like}
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              backgroundColor: color,
                              color: "#000",
                              fontWeight: "bold",
                              border: "1px solid rgba(255,255,255,0.2)",
                              cursor: count > 0 ? "pointer" : "default",
                              position: "relative"
                            }}
                            title={count > 0 ? `${count} risk(s) in this category` : ""}
                          >
                            {rating}
                            {count > 0 && (
                              <div style={{
                                position: "absolute",
                                top: "2px",
                                right: "2px",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                color: "#fff",
                                borderRadius: "50%",
                                width: "18px",
                                height: "18px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.7em"
                              }}>
                                {count}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "12px", fontSize: "0.8em", opacity: 0.8 }}>
              <strong>Legend:</strong> Green (1-5): Low | Yellow (6-12): Medium | Orange (13-16): High | Red (17-25): Critical
            </div>
            
            {/* Explanatory note about non-linear severity scale */}
            <div style={{
              marginTop: "12px",
              padding: "8px 12px",
              backgroundColor: "rgba(255, 165, 0, 0.1)",
              border: "1px solid rgba(255, 165, 0, 0.3)",
              borderRadius: "6px",
              fontSize: "0.8em",
              color: "#ffa500",
              lineHeight: "1.4"
            }}>
              <strong>Note:</strong> The severity scale uses a non-linear progression (1, 3, 4, 5) to reflect the exponential increase in risk severity. Level 2 is intentionally omitted as there is no meaningful distinction between minor injuries (1) and those requiring medical treatment (3).
            </div>
          </div>

          <NeonTable
          columns={[
            { header: "Title", accessor: "title" },
            { header: "Description", accessor: "description" },
            { header: "Department", accessor: "department" },
            { header: "Severity", accessor: "severity" },
            { header: "Likelihood", accessor: "likelihood" },
            { header: "Risk Rating", accessor: "risk_rating" },
            { header: "Actions", accessor: "actions" },
          ]}
          data={riskAssessments.map((risk) => {
            const rating = risk.risk_rating || calculateRiskRating(risk.severity, risk.likelihood || 3);
            const riskLevel = getRiskLevel(rating);
            const riskColor = getRiskColor(rating);
            const department = departments.find(d => d.id === risk.department_id);

            return {
              title: risk.title,
              description: risk.description,
              department: department?.name || "N/A",
              severity: risk.severity,
              likelihood: getLikelihoodLabel(risk.likelihood || 3),
              risk_rating: (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "50px",
                      padding: "4px 8px",
                      backgroundColor: riskColor,
                      color: "#000",
                      fontWeight: "bold",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    {rating}
                  </span>
                  <span style={{ fontSize: "0.9em", opacity: 0.8 }}>({riskLevel})</span>
                </div>
              ),
              actions: (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <NeonIconButton
                    variant="edit"
                    title="Amend"
                    onClick={() => {
                      setMode("edit");
                      setSelectedId(risk.id);
                    }}
                  />
                  <NeonIconButton
                    variant="assign"
                    title="Assign"
                    onClick={() => {
                      setMode("assign");
                      setSelectedId(risk.id);
                    }}
                  />
                </div>
              ),
            };
          })}
        />
        </>
      )}

      <OverlayDialog
        open={mode === "create" || mode === "edit"}
        onClose={handleCancel}
        ariaLabelledby="risk-assessment-form-title"
      >
        <NeonForm
          title={
            mode === "create"
              ? "Create Risk Assessment"
              : "Edit Risk Assessment"
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        >
            {/* Top row: Title, Description, Department inline */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 2fr 1fr", 
              gap: "12px",
              alignItems: "start",
              marginBottom: "16px"
            }}>
              <input
                className="neon-input"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ height: "40px" }}
              />
              <input
                className="neon-input"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ height: "40px" }}
              />
              <select
                className="neon-input"
                value={departmentId || ""}
                onChange={(e) => setDepartmentId(e.target.value)}
                style={{ height: "40px" }}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Second row: Severity, Likelihood, Risk Score inline */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr 2fr", 
              gap: "12px",
              alignItems: "start",
              marginBottom: "16px"
            }}>
              <select
                className="neon-input"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{ height: "40px" }}
              >
                <option value="Low">Low (1) - Minor injury, first aid</option>
                <option value="Medium">Medium (3) - Injury requiring medical treatment</option>
                <option value="High">High (4) - Serious injury, hospitalization</option>
                <option value="Critical">Critical (5) - Fatality, permanent disability</option>
              </select>
              <select
                className="neon-input"
                value={likelihood}
                onChange={(e) => setLikelihood(parseInt(e.target.value))}
                style={{ height: "40px" }}
              >
                <option value={1}>1 - Rare</option>
                <option value={2}>2 - Unlikely</option>
                <option value={3}>3 - Possible</option>
                <option value={4}>4 - Likely</option>
                <option value={5}>5 - Almost Certain</option>
              </select>
              
              {/* Risk Rating Preview - Inline */}
              <div style={{
                padding: "8px 16px",
                backgroundColor: "rgba(0, 255, 255, 0.1)",
                border: "1px solid #00ffff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                height: "40px"
              }}>
                <span style={{
                  display: "inline-block",
                  minWidth: "40px",
                  padding: "4px 12px",
                  backgroundColor: getRiskColor(calculateRiskRating(severity, likelihood)),
                  color: "#000",
                  fontWeight: "bold",
                  fontSize: "1em",
                  borderRadius: "4px",
                  textAlign: "center",
                }}>
                  {calculateRiskRating(severity, likelihood)}
                </span>
                <div style={{ fontSize: "0.85em" }}>
                  <span style={{ fontWeight: "bold" }}>
                    {getRiskLevel(calculateRiskRating(severity, likelihood))}
                  </span>
                  <span style={{ opacity: 0.7, marginLeft: "4px" }}>
                    ({getSeverityNumeric(severity)} × {likelihood})
                  </span>
                </div>
              </div>
            </div>

            {/* Explanatory note about non-linear severity scale */}
            <div style={{
              padding: "8px 12px",
              backgroundColor: "rgba(255, 165, 0, 0.1)",
              border: "1px solid rgba(255, 165, 0, 0.3)",
              borderRadius: "6px",
              fontSize: "0.85em",
              color: "#ffa500",
              marginBottom: "16px",
              lineHeight: "1.4"
            }}>
              <strong>Note:</strong> The severity scale uses a non-linear progression (1, 3, 4, 5) to reflect the exponential increase in risk severity. Level 2 is intentionally omitted as there is no meaningful distinction between minor injuries (1) and those requiring medical treatment (3).
            </div>

            {/* Third row: Persons at Risk, Injury Risk inline */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "12px",
              alignItems: "start",
              marginBottom: "16px"
            }}>
              <input
                className="neon-input"
                placeholder="Persons at Risk"
                value={personsAtRisk}
                onChange={(e) => setPersonsAtRisk(e.target.value)}
                style={{ height: "40px" }}
              />
              <input
                className="neon-input"
                placeholder="Injury Risk"
                value={injuryRisk}
                onChange={(e) => setInjuryRisk(e.target.value)}
                style={{ height: "40px" }}
              />
            </div>

            <textarea
              className="neon-input"
              placeholder="Control Measures"
              value={controlMeasures}
              onChange={(e) => setControlMeasures(e.target.value)}
              style={{ marginBottom: "16px" }}
            />

            <input
              className="neon-input"
              placeholder="Photo URLs (comma separated)"
              value={photoUrls.join(",")}
              onChange={(e) =>
                setPhotoUrls(e.target.value.split(",").map((s) => s.trim()))
              }
              style={{ marginBottom: "16px" }}
            />

            {/* Review Period with label */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px"
            }}>
              <label style={{ 
                color: "#00ffff", 
                fontSize: "0.9em",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
              }}>
                Review Period (months):
              </label>
              <input
                className="neon-input"
                type="number"
                placeholder="12"
                value={reviewPeriod}
                onChange={(e) => setReviewPeriod(parseInt(e.target.value))}
                style={{ width: "80px" }}
              />
            </div>
          </NeonForm>
      </OverlayDialog>

      {mode === "assign" && (
        <NeonPanel>
          <h3 className="neon-form-title">Assign Risk Assessment</h3>
          <p>
            Assigning:{" "}
            <strong>
              {riskAssessments.find((r) => r.id === selectedId)?.title}
            </strong>
          </p>
          <select
            className="neon-input"
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
          >
            <option value="">Select user from department</option>
            {departmentUsers.map((user) => (
              <option key={user.auth_id} value={user.auth_id}>
                {user.email}
              </option>
            ))}
          </select>
          <button
            className="neon-btn neon-btn-assign"
            type="button"
            onClick={async () => {
              if (!selectedId || !assignUserId) return;
              const { error } = await supabase
                .from("turkus_risk_assignments")
                .insert({
                  risk_id: selectedId,
                  auth_id: assignUserId,
                });
              if (!error) setMode("list");
            }}
          >
            Confirm Assignment
          </button>
        </NeonPanel>
      )}
    </div>
  );
}
