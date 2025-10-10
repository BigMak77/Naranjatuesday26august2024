import React, { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Papa from "papaparse";
import OverlayDialog from "../ui/OverlayDialog";
import NeonIconButton from "../ui/NeonIconButton";

const AVAILABLE_COLUMNS = [
  "first_name",
  "last_name",
  "email",
  "employee_number",
  "department_name",
  "role_name",
  "access_level",
  "phone",
  "start_date",
];

interface UserCSVImportProps {
  onImport: (usersToImport: any[]) => Promise<void>;
  onError: (error: string) => void;
}

const UserCSVImport: React.FC<UserCSVImportProps> = ({ onImport, onError }) => {
  const [step, setStep] = useState(1); // 1: Select, 2: Preview, 3: Select Columns, 4: Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<any[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(AVAILABLE_COLUMNS);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvFile(e.target.files?.[0] || null);
    setError(null);
    setSuccess(null);
    setStep(1);
    setParsedUsers([]);
    setSelectedColumns(AVAILABLE_COLUMNS);
  };

  const handleParse = async () => {
    if (!csvFile) return;
    setError(null);
    setSuccess(null);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedUsers(results.data as any[]);
        setStep(2);
      },
      error: (err) => setError(err.message),
    });
  };

  const handleColumnToggle = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  };

  const handleNextToColumns = () => {
    setStep(3);
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      // Only include selected columns in the update
      const filteredUsers = parsedUsers.map((user) => {
        const filtered: any = {};
        selectedColumns.forEach((col) => {
          let value = user[col];
          if (col === "start_date" && value) {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (match) {
              value = `${match[3]}-${match[2]}-${match[1]}`;
            }
          }
          filtered[col] = value;
        });
        return filtered;
      });
      // Debug: log the filtered users before import
      console.log("[UserCSVImport] Upsert payload:", filteredUsers);

      // NEW: Download all users from the table for comparison
      const { data: allUsers, error: allUsersError } = await supabase
        .from("users")
        .select("employee_number, email");
      if (allUsersError) throw allUsersError;
      const existingEmpNumbers = new Set((allUsers || []).map(u => u.employee_number));
      const existingEmails = new Set((allUsers || []).map(u => u.email));

      // Split users into updates and inserts
      const toUpdate = filteredUsers.filter(u => existingEmpNumbers.has(u.employee_number) || existingEmails.has(u.email));
      const toInsert = filteredUsers.filter(u => !existingEmpNumbers.has(u.employee_number) && !existingEmails.has(u.email));

      // Update only filtered columns for existing users
      let updateError = null;
      if (toUpdate.length > 0) {
        for (const user of toUpdate) {
          // Only update selected columns, not employee_number or email
          const updateFields = { ...user };
          delete updateFields.employee_number;
          delete updateFields.email;
          let query = supabase.from("users").update(updateFields);
          if (user.employee_number && existingEmpNumbers.has(user.employee_number)) {
            query = query.eq("employee_number", user.employee_number);
          } else if (user.email && existingEmails.has(user.email)) {
            query = query.eq("email", user.email);
          }
          const { error: upErr } = await query;
          if (upErr) updateError = upErr;
        }
      }
      // Insert new users
      let insertError = null;
      if (toInsert.length > 0) {
        const { error: insErr } = await supabase
          .from("users")
          .insert(toInsert);
        if (insErr) {
          // Check for duplicate key error (unique constraint violation)
          if (insErr.code === "23505" && insErr.message && insErr.message.includes("duplicate key value violates unique constraint")) {
            setError("Duplicate employee_number or email detected in your CSV. Please check for existing users before importing.");
            onError("Duplicate employee_number or email detected in your CSV. Please check for existing users before importing.");
            return;
          }
          insertError = insErr;
        }
      }
      if (updateError || insertError) {
        throw updateError || insertError;
      }
      await onImport(filteredUsers); // Refresh parent data
      setSuccess("Users imported successfully!");
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to import users.");
      onError(err.message || "Failed to import users.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <NeonIconButton
        variant="upload"
        title="Upload Users CSV"
        onClick={() => setModalOpen(true)}
      />
      <OverlayDialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <strong>Step {step} of 4:</strong> {step === 1 ? "Select File" : step === 2 ? "Preview Data" : step === 3 ? "Select Columns" : "Upload Complete"}
          </div>
          {step === 1 && (
            <div>
              <input type="file" accept=".csv" onChange={handleFileChange} />
              <button onClick={handleParse} disabled={!csvFile}>Preview</button>
            </div>
          )}
          {step === 2 && (
            <div>
              <h4>Preview Users</h4>
              <div style={{ maxHeight: 200, overflow: "auto", border: "1px solid #ccc" }}>
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      {parsedUsers[0] && Object.keys(parsedUsers[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedUsers.map((user, idx) => (
                      <tr key={idx}>
                        {Object.values(user).map((val, i) => (
                          <td key={i}>{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleNextToColumns} style={{ marginTop: 16 }}>Next: Select Columns</button>
              <button onClick={() => setStep(1)} style={{ marginLeft: 8 }}>Back</button>
            </div>
          )}
          {step === 3 && (
            <div>
              <h4>Select Columns to Update</h4>
              <div style={{ marginBottom: 16 }}>
                {AVAILABLE_COLUMNS.map((col) => (
                  <label key={col} style={{ marginRight: 16 }}>
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col)}
                      onChange={() => handleColumnToggle(col)}
                    />
                    {col}
                  </label>
                ))}
              </div>
              <button onClick={handleUpload} disabled={uploading || selectedColumns.length === 0}>
                {uploading ? "Uploading..." : "Confirm & Upload"}
              </button>
              <button onClick={() => setStep(2)} style={{ marginLeft: 8 }}>Back</button>
            </div>
          )}
          {step === 4 && (
            <div>
              {success && <div style={{ color: "green" }}>{success}</div>}
              <button onClick={() => { setStep(1); setCsvFile(null); setParsedUsers([]); setSuccess(null); setSelectedColumns(AVAILABLE_COLUMNS); }}>Import Another</button>
            </div>
          )}
          {error && <div style={{ color: "red" }}>{error}</div>}
          <div style={{ marginTop: 16 }}>
            <strong>CSV format:</strong>
            <pre>{AVAILABLE_COLUMNS.join(",")}</pre>
          </div>
        </div>
      </OverlayDialog>
    </>
  );
};

export default UserCSVImport;
