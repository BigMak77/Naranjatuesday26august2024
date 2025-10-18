"use client";
import React, { useState } from "react";
import { FiClipboard, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";

interface PastedEmployee {
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
  _hasError: boolean;
  _errorMessage?: string;
}

interface ColumnMapping {
  sourceIndex: number;
  targetField: keyof PastedEmployee;
  confidence: "high" | "medium" | "low";
}

interface PasteEmployeeDataProps {
  onImport: (employees: PastedEmployee[]) => void;
  onCancel: () => void;
}

const FIELD_PATTERNS = {
  first_name: /^(first|fname|first.?name|given.?name|forename)$/i,
  last_name: /^(last|lname|last.?name|surname|family.?name)$/i,
  email: /^(email|e-?mail|mail|contact)$/i,
  employee_number: /^(emp|employee|emp.?(number|no|num|#)|staff.?(number|no|id)|badge)$/i,
  start_date: /^(start|start.?date|hire.?date|join.?date|commenced)$/i,
  phone: /^(phone|tel|telephone|mobile|cell)$/i,
  department_name: /^(dept|department|division|team)$/i,
  role_name: /^(role|job.?title|title|position)$/i,
  access_level: /^(access|level|access.?level|permission)$/i
};

const DATA_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  employee_number: /^[A-Z0-9-_]+$/i,
  start_date: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/,
  phone: /^[\d\s\-\+\(\)]+$/
};

export default function PasteEmployeeData({ onImport, onCancel }: PasteEmployeeDataProps) {
  const [pastedText, setPastedText] = useState("");
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [previewEmployees, setPreviewEmployees] = useState<PastedEmployee[]>([]);
  const [step, setStep] = useState<"paste" | "map" | "preview">("paste");
  const [error, setError] = useState<string | null>(null);

  function detectDelimiter(text: string): string {
    const firstLine = text.split("\n")[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;

    // If there are tabs and they're more common than commas, it's TSV (from spreadsheet copy)
    if (tabCount > 0 && tabCount >= commaCount) return "\t";
    // Otherwise assume CSV
    return ",";
  }

  function parseTextData(text: string) {
    const lines = text.trim().split("\n").filter(line => line.trim());
    if (lines.length === 0) {
      setError("No data detected. Please paste employee data.");
      return;
    }

    const delimiter = detectDelimiter(text);
    const rows = lines.map(line =>
      line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ""))
    );

    // First row is likely headers
    const detectedHeaders = rows[0];
    const dataRows = rows.slice(1);

    if (dataRows.length === 0) {
      setError("No data rows found. Please include at least one employee row.");
      return;
    }

    setHeaders(detectedHeaders);
    setParsedData(dataRows);

    // Auto-detect column mappings
    const mappings = autoMapColumns(detectedHeaders, dataRows);
    setColumnMappings(mappings);

    setStep("map");
    setError(null);
  }

  function autoMapColumns(headers: string[], dataRows: string[][]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];

    headers.forEach((header, index) => {
      // Try to match by header name
      for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
        if (pattern.test(header)) {
          mappings.push({
            sourceIndex: index,
            targetField: field as keyof PastedEmployee,
            confidence: "high"
          });
          return;
        }
      }

      // If no header match, try to infer from data
      const columnData = dataRows.map(row => row[index]).filter(Boolean);
      if (columnData.length > 0) {
        const inferredField = inferFieldFromData(columnData);
        if (inferredField) {
          mappings.push({
            sourceIndex: index,
            targetField: inferredField,
            confidence: "medium"
          });
          return;
        }
      }

      // No match found - will need manual mapping
    });

    return mappings;
  }

  function inferFieldFromData(columnData: string[]): keyof PastedEmployee | null {
    const sampleSize = Math.min(5, columnData.length);
    const samples = columnData.slice(0, sampleSize);

    // Check for email pattern
    if (samples.every(s => DATA_PATTERNS.email.test(s))) {
      return "email";
    }

    // Check for phone pattern
    if (samples.every(s => DATA_PATTERNS.phone.test(s))) {
      return "phone";
    }

    // Check for date pattern
    if (samples.every(s => DATA_PATTERNS.start_date.test(s))) {
      return "start_date";
    }

    // Check for employee number pattern
    if (samples.every(s => DATA_PATTERNS.employee_number.test(s))) {
      return "employee_number";
    }

    return null;
  }

  function updateMapping(sourceIndex: number, targetField: keyof PastedEmployee | "") {
    setColumnMappings(prev => {
      // Remove existing mapping for this source
      const filtered = prev.filter(m => m.sourceIndex !== sourceIndex);

      // Add new mapping if target is not empty
      if (targetField) {
        filtered.push({
          sourceIndex,
          targetField: targetField as keyof PastedEmployee,
          confidence: "high"
        });
      }

      return filtered;
    });
  }

  function generatePreview() {
    const employees: PastedEmployee[] = [];

    parsedData.forEach((row, rowIndex) => {
      const employee: any = {
        _rowNumber: rowIndex + 2 // +2 because row 1 is headers, and display is 1-indexed
      };

      // Apply mappings
      columnMappings.forEach(mapping => {
        const value = row[mapping.sourceIndex];
        if (value) {
          if (mapping.targetField === "start_date" && value) {
            // Try to convert DD/MM/YYYY to YYYY-MM-DD
            const ddmmyyyyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (ddmmyyyyMatch) {
              employee[mapping.targetField] = `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`;
            } else {
              employee[mapping.targetField] = value;
            }
          } else {
            employee[mapping.targetField] = value;
          }
        }
      });

      // Validate required fields
      const errors: string[] = [];
      if (!employee.first_name) errors.push("First name missing");
      if (!employee.last_name) errors.push("Last name missing");
      if (!employee.email) errors.push("Email missing");
      else if (!DATA_PATTERNS.email.test(employee.email)) errors.push("Invalid email format");
      if (!employee.employee_number) errors.push("Employee number missing");

      employee._hasError = errors.length > 0;
      employee._errorMessage = errors.join(", ");

      employees.push(employee);
    });

    setPreviewEmployees(employees);
    setStep("preview");
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    setPastedText(text);

    // Auto-parse on paste
    setTimeout(() => {
      parseTextData(text);
    }, 100);
  }

  function handleConfirmImport() {
    const validEmployees = previewEmployees.filter(emp => !emp._hasError);
    if (validEmployees.length === 0) {
      setError("No valid employees to import. Please fix errors or cancel.");
      return;
    }
    onImport(validEmployees);
  }

  function renderPasteStep() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <FiClipboard className="text-orange-500" />
            Paste Employee Data
          </h3>
          <p className="text-gray-600">
            Copy cells from your spreadsheet (Excel, Google Sheets) and paste them below
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Tip:</strong> Select and copy the data including headers from your spreadsheet
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>Include column headers in the first row</li>
            <li>Ensure First Name, Last Name, Email, and Employee Number are included</li>
            <li>Dates should be in YYYY-MM-DD or DD/MM/YYYY format</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste Your Data Here
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste spreadsheet data here...&#10;&#10;Example:&#10;First Name    Last Name    Email                    Employee Number    Start Date&#10;John          Doe          john.doe@company.com     EMP001            2024-01-15&#10;Jane          Smith        jane.smith@company.com   EMP002            2024-01-20"
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => parseTextData(pastedText)}
            disabled={!pastedText.trim()}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Parse Data
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  function renderMapStep() {
    const availableFields: Array<{ value: keyof PastedEmployee | ""; label: string }> = [
      { value: "", label: "-- Ignore this column --" },
      { value: "first_name", label: "First Name *" },
      { value: "last_name", label: "Last Name *" },
      { value: "email", label: "Email *" },
      { value: "employee_number", label: "Employee Number *" },
      { value: "start_date", label: "Start Date" },
      { value: "phone", label: "Phone" },
      { value: "department_name", label: "Department Name" },
      { value: "role_name", label: "Role Name" },
      { value: "access_level", label: "Access Level" }
    ];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Map Columns</h3>
          <p className="text-gray-600">
            Confirm or adjust how your spreadsheet columns map to employee fields
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <FiCheck className="inline mr-2" />
            Detected {parsedData.length} employee rows from your pasted data
          </p>
        </div>

        <div className="space-y-3">
          {headers.map((header, index) => {
            const mapping = columnMappings.find(m => m.sourceIndex === index);
            const sampleData = parsedData.slice(0, 2).map(row => row[index]);

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Column {index + 1}:</span>
                      <span className="text-sm font-semibold">{header || "(no header)"}</span>
                      {mapping && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          mapping.confidence === "high" ? "bg-green-100 text-green-800" :
                          mapping.confidence === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {mapping.confidence === "high" ? "Auto-detected" : "Inferred"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Sample: {sampleData.join(", ")}
                    </div>
                  </div>

                  <div className="w-64">
                    <select
                      value={mapping?.targetField || ""}
                      onChange={(e) => updateMapping(index, e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {availableFields.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={generatePreview}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Preview Import
          </button>
          <button
            onClick={() => setStep("paste")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  function renderPreviewStep() {
    const validCount = previewEmployees.filter(emp => !emp._hasError).length;
    const errorCount = previewEmployees.length - validCount;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Preview & Confirm</h3>
          <p className="text-gray-600">
            Review the parsed employees before importing
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <FiCheck className="inline mr-2" />
              <strong>{validCount}</strong> valid employees
            </p>
          </div>
          {errorCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <FiAlertCircle className="inline mr-2" />
                <strong>{errorCount}</strong> employees with errors
              </p>
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Row</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Emp #</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewEmployees.map((emp, index) => (
                  <tr key={index} className={emp._hasError ? "bg-red-50" : "bg-white"}>
                    <td className="px-3 py-2 text-gray-600">{emp._rowNumber}</td>
                    <td className="px-3 py-2">
                      {emp._hasError ? (
                        <FiX className="text-red-500" />
                      ) : (
                        <FiCheck className="text-green-500" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {emp.first_name} {emp.last_name}
                      {emp._hasError && (
                        <div className="text-xs text-red-600 mt-1">{emp._errorMessage}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">{emp.email}</td>
                    <td className="px-3 py-2">{emp.employee_number}</td>
                    <td className="px-3 py-2">{emp.start_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {errorCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <FiAlertCircle className="inline mr-2" />
              Employees with errors will be skipped. Only valid employees will be imported.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirmImport}
            disabled={validCount === 0}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <FiCheck />
            Import {validCount} Employee{validCount !== 1 ? "s" : ""}
          </button>
          <button
            onClick={() => setStep("map")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Mapping
          </button>
          <button
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
    <div className="bg-white rounded-lg p-6">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {step === "paste" && renderPasteStep()}
      {step === "map" && renderMapStep()}
      {step === "preview" && renderPreviewStep()}
    </div>
  );
}
