"use client";
import React, { useState } from "react";
import Papa from "papaparse";
import { FiUpload, FiDownload, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";

interface CSVEmployee {
  first_name: string;
  last_name: string;
  email: string;
  employee_number: string;
  start_date: string;
  phone?: string;
  department_name?: string;
  role_name?: string;
  access_level?: string;
  _rowNumber: number;
  _errors: string[];
  _isValid: boolean;
}

interface CSVEmployeeUploadProps {
  existingEmails: Set<string>;
  existingEmployeeNumbers: Set<string>;
  onImport: (employees: CSVEmployee[]) => void;
  onCancel: () => void;
}

export default function CSVEmployeeUpload({
  existingEmails,
  existingEmployeeNumbers,
  onImport,
  onCancel
}: CSVEmployeeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedEmployees, setParsedEmployees] = useState<CSVEmployee[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [error, setError] = useState<string | null>(null);

  function downloadTemplate() {
    const headers = [
      "first_name",
      "last_name",
      "email",
      "employee_number",
      "start_date",
      "phone",
      "department_name",
      "role_name",
      "access_level"
    ];

    const example1 = [
      "John",
      "Doe",
      "john.doe@company.com",
      "EMP001",
      "2024-01-15",
      "555-0123",
      "Engineering",
      "Software Developer",
      "user"
    ];

    const example2 = [
      "Jane",
      "Smith",
      "jane.smith@company.com",
      "EMP002",
      "2024-01-20",
      "555-0124",
      "Marketing",
      "Marketing Manager",
      "manager"
    ];

    const csv = [headers.join(","), example1.join(","), example2.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_import_template.csv";
    a.click();
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setError(null);
  }

  function parseCSV() {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const employees: CSVEmployee[] = [];

        results.data.forEach((row: any, index: number) => {
          const emp: CSVEmployee = {
            first_name: row.first_name?.trim() || "",
            last_name: row.last_name?.trim() || "",
            email: row.email?.trim().toLowerCase() || "",
            employee_number: row.employee_number?.trim() || "",
            start_date: row.start_date?.trim() || "",
            phone: row.phone?.trim() || "",
            department_name: row.department_name?.trim() || "",
            role_name: row.role_name?.trim() || "",
            access_level: row.access_level?.trim() || "user",
            _rowNumber: index + 2, // +2 because row 1 is headers
            _errors: [],
            _isValid: false
          };

          // Validate
          const errors: string[] = [];

          if (!emp.first_name) errors.push("First name missing");
          if (!emp.last_name) errors.push("Last name missing");
          if (!emp.email) errors.push("Email missing");
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
            errors.push("Invalid email format");
          }
          if (!emp.employee_number) errors.push("Employee number missing");

          // Uniqueness checks
          if (emp.email && existingEmails.has(emp.email)) {
            errors.push("Email already exists");
          }
          if (emp.employee_number && existingEmployeeNumbers.has(emp.employee_number)) {
            errors.push("Employee number already exists");
          }

          // Check for duplicates within the CSV
          const duplicateEmail = employees.find(e => e.email === emp.email && emp.email);
          if (duplicateEmail) {
            errors.push(`Duplicate email (row ${duplicateEmail._rowNumber})`);
          }

          const duplicateEmpNum = employees.find(e => e.employee_number === emp.employee_number && emp.employee_number);
          if (duplicateEmpNum) {
            errors.push(`Duplicate employee # (row ${duplicateEmpNum._rowNumber})`);
          }

          // Date format validation
          if (emp.start_date) {
            // Try to convert DD/MM/YYYY to YYYY-MM-DD
            const ddmmyyyyMatch = emp.start_date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (ddmmyyyyMatch) {
              emp.start_date = `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`;
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(emp.start_date)) {
              errors.push("Invalid date format (use YYYY-MM-DD or DD/MM/YYYY)");
            }
          }

          emp._errors = errors;
          emp._isValid = errors.length === 0;

          employees.push(emp);
        });

        if (employees.length === 0) {
          setError("No valid data found in CSV file");
          return;
        }

        setParsedEmployees(employees);
        setStep("preview");
        setError(null);
      },
      error: (error) => {
        setError(`CSV parsing error: ${error.message}`);
      }
    });
  }

  function handleConfirmImport() {
    const validEmployees = parsedEmployees.filter(emp => emp._isValid);

    if (validEmployees.length === 0) {
      setError("No valid employees to import. Please fix errors and try again.");
      return;
    }

    onImport(validEmployees);
  }

  const validCount = parsedEmployees.filter(e => e._isValid).length;
  const errorCount = parsedEmployees.length - validCount;

  if (step === "preview") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">CSV Preview</h3>
          <p className="text-gray-600">Review the parsed employees from your CSV file</p>
        </div>

        <div className="stats-grid">
          <div className="neon-panel" style={{
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            border: '1px solid var(--text-success)'
          }}>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-success)' }}>
              <FiCheck style={{ display: 'inline', marginRight: '0.5rem' }} />
              <strong>{validCount}</strong> valid employee{validCount !== 1 ? "s" : ""}
            </p>
          </div>
          {errorCount > 0 && (
            <div className="neon-panel" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--text-error)'
            }}>
              <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-error)' }}>
                <FiAlertCircle style={{ display: 'inline', marginRight: '0.5rem' }} />
                <strong>{errorCount}</strong> row{errorCount !== 1 ? "s" : ""} with errors
              </p>
            </div>
          )}
        </div>

        <div className="neon-table" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '384px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 'var(--font-size-base)' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr>
                  <th className="neon-table">Row</th>
                  <th className="neon-table">Status</th>
                  <th className="neon-table">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Emp #</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Department</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Role</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedEmployees.map((emp, index) => (
                  <tr key={index} className={!emp._isValid ? "bg-red-50" : "bg-white"}>
                    <td className="px-3 py-2 text-gray-600">{emp._rowNumber}</td>
                    <td className="px-3 py-2">
                      {emp._isValid ? (
                        <FiCheck className="text-green-500" />
                      ) : (
                        <FiX className="text-red-500" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {emp.first_name} {emp.last_name}
                      {!emp._isValid && (
                        <div className="text-xs text-red-600 mt-1">{emp._errors.join(", ")}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">{emp.email}</td>
                    <td className="px-3 py-2">{emp.employee_number}</td>
                    <td className="px-3 py-2">{emp.department_name}</td>
                    <td className="px-3 py-2">{emp.role_name}</td>
                    <td className="px-3 py-2">{emp.start_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {errorCount > 0 && (
          <div className="neon-panel" style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid #eab308'
          }}>
            <p style={{ fontSize: 'var(--font-size-base)', color: '#eab308' }}>
              <FiAlertCircle style={{ display: 'inline', marginRight: '0.5rem' }} />
              Employees with errors will be skipped. Only valid employees will be imported.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={validCount === 0}
            className="neon-btn-primary transition-colors"
            style={{ 
              opacity: validCount === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FiCheck />
            Import {validCount} Employee{validCount !== 1 ? "s" : ""}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("upload");
              setFile(null);
              setParsedEmployees([]);
            }}
            className="neon-btn-cancel transition-colors"
          >
            Upload Different File
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 className="neon-heading" style={{ 
          marginBottom: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          <FiUpload style={{ color: '#fa7a20' }} />
          Upload CSV File
        </h3>
        <p className="neon-text">Select a CSV file containing employee data</p>
      </div>

      {error && (
        <div className="neon-panel" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--text-error)',
          color: 'var(--text-error)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}>
          <FiAlertCircle style={{ width: '20px', height: '20px', marginTop: '0.125rem', flexShrink: 0 }} />
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 mb-3">
          <strong>CSV File Requirements:</strong>
        </p>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>First row must contain column headers</li>
          <li>Required columns: first_name, last_name, email, employee_number</li>
          <li>Optional columns: start_date, phone, department_name, role_name, access_level</li>
          <li>Date format: YYYY-MM-DD or DD/MM/YYYY</li>
        </ul>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-orange-600 hover:text-orange-700 flex items-center gap-2 mx-auto mb-6"
        >
          <FiDownload />
          Download CSV Template
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-orange-500 transition-colors">
        <FiUpload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <div className="mb-4">
          <label className="cursor-pointer">
            <span className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg inline-block transition-colors">
              Select CSV File
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
        {file && (
          <div className="text-sm text-gray-600">
            Selected: <strong>{file.name}</strong>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={parseCSV}
          disabled={!file}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Parse & Preview
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
