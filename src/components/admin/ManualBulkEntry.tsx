"use client";
import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiAlertCircle, FiCheck, FiX } from "react-icons/fi";

interface ManualEmployee {
  first_name: string;
  last_name: string;
  email: string;
  employee_number: string;
  start_date: string;
  phone?: string;
  department_id: string;
  role_id: string;
  access_level: string;
  _rowIndex: number;
  _errors: string[];
  _isValid: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  title: string;
  department_id?: string;
}

interface ManualBulkEntryProps {
  departments: Department[];
  roles: Role[];
  existingEmails: Set<string>;
  existingEmployeeNumbers: Set<string>;
  onComplete: (employees: ManualEmployee[]) => void;
  onCancel: () => void;
}

const ACCESS_LEVELS = [
  { value: "user", label: "User" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" }
];

export default function ManualBulkEntry({
  departments,
  roles,
  existingEmails,
  existingEmployeeNumbers,
  onComplete,
  onCancel
}: ManualBulkEntryProps) {
  const [employees, setEmployees] = useState<ManualEmployee[]>([
    getEmptyEmployee(0),
    getEmptyEmployee(1),
    getEmptyEmployee(2)
  ]);

  const [validationEnabled, setValidationEnabled] = useState(false);

  function getEmptyEmployee(index: number): ManualEmployee {
    return {
      first_name: "",
      last_name: "",
      email: "",
      employee_number: "",
      start_date: new Date().toISOString().split('T')[0],
      phone: "",
      department_id: "",
      role_id: "",
      access_level: "user",
      _rowIndex: index,
      _errors: [],
      _isValid: false
    };
  }

  function addRow() {
    setEmployees(prev => [...prev, getEmptyEmployee(prev.length)]);
  }

  function removeRow(index: number) {
    if (employees.length <= 1) return; // Keep at least one row
    setEmployees(prev => prev.filter((_, i) => i !== index));
  }

  function updateField(index: number, field: keyof ManualEmployee, value: any) {
    setEmployees(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });

    // Re-validate after short delay
    if (validationEnabled) {
      setTimeout(() => validateRow(index), 200);
    }
  }

  function validateRow(index: number) {
    const emp = employees[index];
    const errors: string[] = [];

    // Required fields
    if (!emp.first_name?.trim()) errors.push("First name required");
    if (!emp.last_name?.trim()) errors.push("Last name required");
    if (!emp.email?.trim()) errors.push("Email required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
      errors.push("Invalid email");
    }
    if (!emp.employee_number?.trim()) errors.push("Employee # required");
    if (!emp.department_id) errors.push("Department required");
    if (!emp.role_id) errors.push("Role required");

    // Uniqueness checks
    const emailLower = emp.email?.toLowerCase();
    if (emailLower && existingEmails.has(emailLower)) {
      errors.push("Email exists in system");
    }

    if (emp.employee_number && existingEmployeeNumbers.has(emp.employee_number)) {
      errors.push("Employee # exists in system");
    }

    // Check duplicates within current batch
    employees.forEach((other, otherIndex) => {
      if (otherIndex !== index) {
        if (other.email?.toLowerCase() === emailLower && emailLower) {
          errors.push(`Duplicate email (row ${otherIndex + 1})`);
        }
        if (other.employee_number === emp.employee_number && emp.employee_number) {
          errors.push(`Duplicate employee # (row ${otherIndex + 1})`);
        }
      }
    });

    setEmployees(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        _errors: errors,
        _isValid: errors.length === 0
      };
      return updated;
    });
  }

  function validateAll() {
    setValidationEnabled(true);
    employees.forEach((_, index) => validateRow(index));
  }

  function handleSubmit() {
    validateAll();

    // Wait a bit for validation to complete
    setTimeout(() => {
      const validEmployees = employees.filter(emp => emp._isValid);
      const hasEmptyRows = employees.some(emp =>
        !emp.first_name && !emp.last_name && !emp.email && !emp.employee_number
      );

      // Filter out completely empty rows
      const nonEmptyEmployees = employees.filter(emp =>
        emp.first_name || emp.last_name || emp.email || emp.employee_number
      );

      if (nonEmptyEmployees.length === 0) {
        alert("Please enter at least one employee");
        return;
      }

      if (validEmployees.length === 0) {
        alert("Please fix validation errors before proceeding");
        return;
      }

      onComplete(validEmployees);
    }, 500);
  }

  function getFilteredRoles(departmentId: string) {
    if (!departmentId) return roles;
    return roles.filter(r => r.department_id === departmentId);
  }

  function copyFromPrevious(index: number) {
    if (index === 0) return;

    const prev = employees[index - 1];
    setEmployees(current => {
      const updated = [...current];
      updated[index] = {
        ...updated[index],
        department_id: prev.department_id,
        role_id: prev.role_id,
        access_level: prev.access_level,
        start_date: prev.start_date
      };
      return updated;
    });
  }

  const validCount = employees.filter(e => e._isValid).length;
  const errorCount = validationEnabled ? employees.filter(e => !e._isValid && (e.first_name || e.last_name || e.email)).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Manual Bulk Entry</h3>
        <p className="text-gray-600">Enter employee details in the table below</p>
      </div>

      {validationEnabled && (
        <div className="grid grid-cols-2 gap-4">
          {validCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <FiCheck className="inline mr-2" />
                <strong>{validCount}</strong> valid employee{validCount !== 1 ? "s" : ""}
              </p>
            </div>
          )}
          {errorCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <FiAlertCircle className="inline mr-2" />
                <strong>{errorCount}</strong> row{errorCount !== 1 ? "s" : ""} with errors
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tips:</strong>
        </p>
        <ul className="text-sm text-blue-700 list-disc list-inside mt-2 space-y-1">
          <li>Add more rows as needed using the "Add Row" button</li>
          <li>Click "Copy from Previous" to reuse common settings</li>
          <li>Fields marked with * are required</li>
          <li>Email and Employee Number must be unique</li>
        </ul>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-3 text-left font-medium text-gray-700 w-8">#</th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[120px]">
                  First Name <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[120px]">
                  Last Name <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[180px]">
                  Email <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[100px]">
                  Emp # <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[140px]">
                  Start Date
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[120px]">
                  Phone
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[150px]">
                  Department <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[150px]">
                  Role <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 min-w-[120px]">
                  Access Level
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp, index) => {
                const hasError = validationEnabled && emp._errors.length > 0;
                const isValid = validationEnabled && emp._isValid;

                return (
                  <tr key={index} className={hasError ? "bg-red-50" : isValid ? "bg-green-50" : "bg-white"}>
                    <td className="px-2 py-2 text-gray-600 font-medium">
                      <div className="flex items-center gap-1">
                        {index + 1}
                        {hasError && <FiX className="text-red-500" />}
                        {isValid && <FiCheck className="text-green-500" />}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={emp.first_name}
                        onChange={(e) => updateField(index, "first_name", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="First"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={emp.last_name}
                        onChange={(e) => updateField(index, "last_name", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Last"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="email"
                        value={emp.email}
                        onChange={(e) => updateField(index, "email", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="email@company.com"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={emp.employee_number}
                        onChange={(e) => updateField(index, "employee_number", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="EMP001"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={emp.start_date}
                        onChange={(e) => updateField(index, "start_date", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="tel"
                        value={emp.phone}
                        onChange={(e) => updateField(index, "phone", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="555-0123"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={emp.department_id}
                        onChange={(e) => {
                          updateField(index, "department_id", e.target.value);
                          // Reset role when department changes
                          updateField(index, "role_id", "");
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select...</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={emp.role_id}
                        onChange={(e) => updateField(index, "role_id", e.target.value)}
                        disabled={!emp.department_id}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                      >
                        <option value="">Select...</option>
                        {getFilteredRoles(emp.department_id).map(role => (
                          <option key={role.id} value={role.id}>{role.title}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={emp.access_level}
                        onChange={(e) => updateField(index, "access_level", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {ACCESS_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => copyFromPrevious(index)}
                            className="p-1 text-gray-400 hover:text-orange-600 transition-colors text-xs"
                            title="Copy from previous row"
                          >
                            Copy
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove row"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Error Messages */}
        {validationEnabled && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {employees.map((emp, index) => (
                emp._errors.length > 0 && (
                  <div key={index} className="text-sm text-red-600">
                    <strong>Row {index + 1}:</strong> {emp._errors.join(", ")}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:text-orange-700 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
        >
          <FiPlus />
          Add Row
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <FiCheck />
            Continue with {validCount > 0 ? validCount : "Valid"} Employee{validCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
