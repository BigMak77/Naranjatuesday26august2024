import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { DialogClose } from "@/components/ui/dialog";

interface RaiseIssueWizardProps {
  onClose: () => void;
}

type Stage = 0 | 1 | 2;

export default function RaiseIssueWizard({ onClose }: RaiseIssueWizardProps) {
  const [stage, setStage] = useState<Stage>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // Fetch departments on mount
  useEffect(() => {
    async function fetchDepartments() {
      const { data, error } = await supabase.from("departments").select("id, name");
      if (data) setDepartments(data);
    }
    fetchDepartments();
  }, []);

  // Map issue type to department ID
  function getDepartmentIdForIssueType(issueType: string): string {
    const mapping: Record<string, string> = {
      "Health and Safety": "Health & Safety",
      "Near Miss": "Health & Safety",
      "Maintenance": "Maintenance",
      "Internal Fabrication Damage": "Maintenance",
      "External Fabrication Damage": "Maintenance",
      "Pest Spotted": "Technical",
    };
    const deptName = mapping[issueType] || "";
    const dept = departments.find((d) => d.name === deptName);
    return dept ? dept.id : "";
  }

  const next = () => {
    setStage((s) => (s < 2 ? ((s + 1) as Stage) : s));
  };

  const prev = () => setStage((s) => (s > 0 ? ((s - 1) as Stage) : s));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    let uploadedUrls: string[] = [];
    let department_id = getDepartmentIdForIssueType(title);
    // Get current user (from supabase auth)
    const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
    const reported_by = user ? user.id : null;
    if (evidenceFiles.length > 0) {
      for (const file of evidenceFiles) {
        const fileExt = file.name.split('.').pop();
        const filePath = `evidence/${Date.now()}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage.from('issue-evidence').upload(filePath, file);
        if (uploadError) {
          setError('Failed to upload evidence: ' + uploadError.message);
          setSubmitting(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from('issue-evidence').getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }
    }
    const { error } = await supabase.from("issues").insert([
      {
        title,
        description,
        priority,
        status: "Open",
        category: title,
        evidence_url: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        department_id,
        reported_by,
      },
    ]);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setShowThankYou(true);
      setTimeout(() => {
        setShowThankYou(false);
        window.location.href = "/user/dashboard";
      }, 2000);
    }
  };

  return (
    <div className="raise-issue-wizard">
      {showThankYou && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-orange-500 text-white px-8 py-8 rounded-lg shadow-lg text-center max-w-md w-full">
            <div className="text-lg font-semibold mb-2">Thank you for submitting the issue</div>
            <div>This helps to maintain the high standards that we all expect</div>
          </div>
        </div>
      )}
      <h2>Raise New Issue</h2>
      {/* Sub-header instructions for each stage */}
      {stage === 0 && (
        <div className="raise-issue-wizard-subheader">
          Please select the type of issue and provide a detailed description. This helps us understand the problem and address it efficiently.
        </div>
      )}
      {stage === 1 && (
        <div className="raise-issue-wizard-subheader">
          Please select the severity/risk of this issue. <br />
          <b>Low:</b> Minor inconvenience, no immediate action required.<br />
          <b>Medium:</b> Could impact safety, quality, or operations if not addressed soon.<br />
          <b>High:</b> Immediate risk to safety, compliance, or business continuity. Requires urgent attention.
        </div>
      )}
      {stage === 2 && (
        <div className="raise-issue-wizard-subheader">
          Please review the details below. If everything is correct, submit the issue. You can go back to make changes if needed.
        </div>
      )}
      {stage === 0 && (
        <div>
          <label>
            Type of Issue
            <select
              className="raise-issue-wizard-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            >
              <option value="">Please select</option>
              <option value="Health and Safety">Health and Safety</option>
              <option value="Near Miss">Near Miss</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Pest Spotted">Pest Spotted</option>
              <option value="Internal Fabrication Damage">Internal Fabrication Damage</option>
              <option value="External Fabrication Damage">External Fabrication Damage</option>
            </select>
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="raise-issue-wizard-textarea"
            />
          </label>
          <label>
            Attach Evidence (optional)
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="raise-issue-wizard-input"
              onChange={e => {
                if (e.target.files) {
                  setEvidenceFiles(Array.from(e.target.files));
                }
              }}
            />
          </label>
          {evidenceFiles.length > 0 && (
            <ul className="raise-issue-wizard-evidence-list">
              {evidenceFiles.map((file, idx) => (
                <li key={idx}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {stage === 1 && (
        <div>
          <label>
            Severity / Risk
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="raise-issue-wizard-input"
            >
              <option value="">Select severity/risk</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>
      )}
      {stage === 2 && (
        <div>
          <h4>Review</h4>
          <div><b>Type of Issue:</b> {title}</div>
          <div><b>Description:</b> {description}</div>
          <div><b>Severity/Risk:</b> {priority}</div>
        </div>
      )}
      {error && <div className="raise-issue-wizard-error">{error}</div>}
      {success && <div className="raise-issue-wizard-success">Issue raised!</div>}
      <div className="raise-issue-wizard-actions">
        <button onClick={onClose} type="button" disabled={submitting}>
          Cancel
        </button>
        {stage > 0 && (
          <button onClick={prev} type="button" disabled={submitting}>
            Back
          </button>
        )}
        {stage < 2 && (
          <button
            onClick={next}
            type="button"
            disabled={
              (stage === 0 && !title) ||
              (stage === 0 && !description) ||
              (stage === 1 && !priority)
            }
          >
            Next
          </button>
        )}
        {stage === 2 && (
          <button
            onClick={handleSubmit}
            type="button"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}
