import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import TextIconButton from "@/components/ui/TextIconButtons";
import { STORAGE_BUCKETS } from "@/lib/storage-config";

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
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // Fetch departments on mount
  useEffect(() => {
    async function fetchDepartments() {
      const { data, error } = await supabase.from("departments").select("id, name").order("name", { ascending: true });
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
        const { data, error: uploadError } = await supabase.storage.from(STORAGE_BUCKETS.ISSUES).upload(filePath, file);
        if (uploadError) {
          setError('Failed to upload evidence: ' + uploadError.message);
          setSubmitting(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKETS.ISSUES).getPublicUrl(filePath);
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
        <div className="thank-you-modal-overlay">
          <div className="thank-you-modal-content">
            <div className="thank-you-modal-title">Thank you for submitting the issue</div>
            <div className="thank-you-modal-message">This helps to maintain the high standards that we all expect</div>
          </div>
        </div>
      )}
      <NeonPanel>
        {stage === 0 && (
          <div>
            <label htmlFor="issue-type">
              Type of Issue
              <select
                id="issue-type"
                className="neon-input"
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
            <label htmlFor="issue-description">
              Description
              <textarea
                id="issue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="neon-input"
                rows={4}
                placeholder="Please provide a detailed description of the issue..."
              />
            </label>
            <div>
              <label htmlFor="evidence-files">Attach Evidence (optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <input
                  id="evidence-files"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files) {
                      setEvidenceFiles(Array.from(e.target.files));
                    }
                  }}
                />
                <TextIconButton
                  variant="search"
                  label="Choose Files"
                  onClick={() => document.getElementById('evidence-files')?.click()}
                />
                <span style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>
                  {evidenceFiles.length > 0
                    ? `${evidenceFiles.length} file${evidenceFiles.length > 1 ? 's' : ''} selected`
                    : 'No files selected'}
                </span>
              </div>
              {evidenceFiles.length > 0 && (
                <ul className="neon-file-list" style={{ marginTop: '0.5rem' }}>
                  {evidenceFiles.map((file, idx) => (
                    <li key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {stage === 1 && (
          <div>
            <label htmlFor="issue-severity">
              Severity / Risk
              <select
                id="issue-severity"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="neon-input"
                required
              >
                <option value="">Select severity/risk</option>
                <option value="Low">Low - Minor inconvenience, no immediate action required</option>
                <option value="Medium">Medium - Could impact safety, quality, or operations</option>
                <option value="High">High - Immediate risk requiring urgent attention</option>
              </select>
            </label>
          </div>
        )}
        {stage === 2 && (
          <div>
            <h4>Review</h4>
            <div className="review-item"><b>Type of Issue:</b> {title}</div>
            <div className="review-item"><b>Description:</b> {description}</div>
            <div className="review-item"><b>Severity/Risk:</b> {priority}</div>
            {evidenceFiles.length > 0 && (
              <div className="review-item">
                <b>Evidence Files:</b>
                <ul className="neon-file-list">
                  {evidenceFiles.map((file, idx) => (
                    <li key={`review-${file.name}-${file.size}-${file.lastModified}-${idx}`}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {error && <div className="neon-error-message">{error}</div>}
        {success && <div className="neon-success-message">Issue raised!</div>}
        <div className="raise-issue-wizard-actions">
          {stage > 0 && (
            <TextIconButton
              variant="back"
              label="Back"
              onClick={prev}
              disabled={submitting}
            >
              Back
            </TextIconButton>
          )}
          {stage < 2 && (
            <TextIconButton
              variant="next"
              label="Next"
              onClick={next}
              disabled={
                (stage === 0 && !title) ||
                (stage === 0 && !description) ||
                (stage === 1 && !priority)
              }
            >
              Next
            </TextIconButton>
          )}
          {stage === 2 && (
            <TextIconButton
              variant="submit"
              label={submitting ? "Submitting..." : "Submit"}
              onClick={handleSubmit}
              disabled={submitting}
            />
          )}
        </div>
      </NeonPanel>
    </div>
  );
}
