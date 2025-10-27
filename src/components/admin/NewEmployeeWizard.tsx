"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  FiUser, FiUsers, FiCheck, FiX, FiAlertCircle,
  FiUpload, FiDownload, FiEdit3, FiArrowRight, FiArrowLeft, FiClipboard
} from "react-icons/fi";
import PasteEmployeeData from "./PasteEmployeeData";
import ManualBulkEntry from "./ManualBulkEntry";
import CSVEmployeeUpload from "./CSVEmployeeUpload";
import CreateDepartmentModal from "./CreateDepartmentModal";
import CreateRoleModal from "./CreateRoleModal";
import MainHeader from "@/components/ui/MainHeader";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { sendWelcomeEmail as sendEmail, sendBulkWelcomeEmails } from "@/lib/email-service";

// Types
interface NewEmployee {
  // Basic Info
  first_name: string;
  last_name: string;
  email: string;
  employee_number: string;
  start_date: string;
  phone?: string;

  // Department & Role
  department_id: string;
  role_id: string;

  // Access & Permissions
  access_level: string;
  permissions: string[];
  shift_id?: string;

  // Additional
  manager_id?: string;
  is_first_aid: boolean;
  notes?: string;

  // Validation state
  _validationErrors?: string[];
  _isValid?: boolean;
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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

type WizardMode = "single" | "bulk";
type BulkMethod = "manual" | "csv" | "paste";
type SingleStep = 1 | 2 | 3 | 4 | 5;
type BulkStep = 1 | 2 | 3 | 4;

const ACCESS_LEVELS = [
  { value: "user", label: "Standard User" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Administrator" },
  { value: "super_admin", label: "Super Admin" }
];

const PERMISSION_OPTIONS = [
  { id: "trainer", label: "Can Train Others", description: "Ability to record training completions" },
  { id: "health_safety_manager", label: "Health & Safety Manager", description: "Full H&S module access" },
  { id: "task_manager", label: "Task Manager", description: "Create and assign tasks" },
  { id: "report_viewer", label: "Report Viewer", description: "View all reports" },
  { id: "audit_manager", label: "Audit Manager", description: "Manage audits and compliance" }
];

export default function NewEmployeeWizard() {
  // Mode and step tracking
  const [mode, setMode] = useState<WizardMode | null>(null);
  const [singleStep, setSingleStep] = useState<SingleStep>(1);
  const [bulkStep, setBulkStep] = useState<BulkStep>(1);
  const [bulkMethod, setBulkMethod] = useState<BulkMethod | null>(null);

  // Data
  const [singleEmployee, setSingleEmployee] = useState<NewEmployee>(getEmptyEmployee());
  const [bulkEmployees, setBulkEmployees] = useState<NewEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);

  // Validation
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const [existingEmployeeNumbers, setExistingEmployeeNumbers] = useState<Set<string>>(new Set());
  const [validationResults, setValidationResults] = useState<Map<number, ValidationResult>>(new Map());

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);

  // Common settings for bulk mode
  const [bulkCommonSettings, setBulkCommonSettings] = useState({
    applyCommonRole: false,
    commonRoleId: "",
    commonDepartmentId: "",
    applyCommonAccess: false,
    commonAccessLevel: "user",
    applyCommonPermissions: false,
    commonPermissions: [] as string[]
  });

  // Initialize
  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      if (deptError) {
        console.error("Error fetching departments:", deptError);
        setError("Failed to load departments. Please refresh the page.");
        return;
      }

      // Fetch roles
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id, title, department_id")
        .order("title");

      if (roleError) {
        console.error("Error fetching roles:", roleError);
        setError("Failed to load roles. Please refresh the page.");
        return;
      }

      // Fetch potential managers (users with manager or admin access)
      const { data: managerData, error: managerError } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("access_level", ["manager", "admin", "super_admin"])
        .order("first_name");

      if (managerError) {
        console.warn("Error fetching managers:", managerError);
        // Non-critical error, continue without managers
      }

      // Fetch existing emails and employee numbers for validation
      const { data: existingUsers, error: existingError } = await supabase
        .from("users")
        .select("email, employee_number");

      if (existingError) {
        console.error("Error fetching existing users:", existingError);
        setError("Failed to load existing user data for validation. Please refresh the page.");
        return;
      }

      setDepartments(deptData || []);
      setRoles(roleData || []);
      setManagers(
        (managerData || []).map(m => ({
          id: m.id,
          name: `${m.first_name} ${m.last_name}`
        }))
      );

      if (existingUsers) {
        setExistingEmails(new Set(existingUsers.map(u => u.email?.toLowerCase()).filter(Boolean)));
        setExistingEmployeeNumbers(new Set(existingUsers.map(u => u.employee_number).filter(Boolean)));
      }
    } catch (err: any) {
      console.error("Unexpected error in fetchInitialData:", err);
      setError(`Failed to initialize: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function getEmptyEmployee(): NewEmployee {
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
      permissions: [],
      shift_id: "",
      manager_id: "",
      is_first_aid: false,
      notes: "",
      _validationErrors: [],
      _isValid: false
    };
  }

  // Validation functions
  async function validateEmployee(employee: NewEmployee, index: number = 0): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!employee.first_name?.trim()) errors.push("First name is required");
    if (!employee.last_name?.trim()) errors.push("Last name is required");
    if (!employee.email?.trim()) errors.push("Email is required");
    if (!employee.employee_number?.trim()) errors.push("Employee number is required");
    if (!employee.department_id) errors.push("Department is required");
    if (!employee.role_id) errors.push("Role is required");

    // Email validation
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      errors.push("Invalid email format");
    }

    // Uniqueness checks
    const emailLower = employee.email?.toLowerCase();
    if (emailLower && existingEmails.has(emailLower)) {
      errors.push("Email already exists in system");
    }

    if (employee.employee_number && existingEmployeeNumbers.has(employee.employee_number.trim())) {
      errors.push("This employee number is not available. It's already assigned to another employee in the system.");
    }

    // Check for duplicates within the current batch (bulk mode)
    if (mode === "bulk") {
      bulkEmployees.forEach((emp, idx) => {
        if (idx !== index) {
          if (emp.email?.toLowerCase() === emailLower) {
            errors.push(`Duplicate email with row ${idx + 1}`);
          }
          if (emp.employee_number === employee.employee_number) {
            errors.push(`Duplicate employee number with row ${idx + 1}`);
          }
        }
      });
    }

    // Start date validation
    if (employee.start_date) {
      const startDate = new Date(employee.start_date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      if (startDate < oneYearAgo) {
        warnings.push("Start date is more than a year ago");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async function validateAllBulkEmployees() {
    const results = new Map<number, ValidationResult>();

    for (let i = 0; i < bulkEmployees.length; i++) {
      const result = await validateEmployee(bulkEmployees[i], i);
      results.set(i, result);
    }

    setValidationResults(results);
    return Array.from(results.values()).every(r => r.isValid);
  }

  // Single employee handlers
  function handleSingleFieldChange(field: keyof NewEmployee, value: any) {
    // Clear errors when user makes changes
    if (error) {
      setError(null);
    }
    
    setSingleEmployee(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function handleSingleNext() {
    console.log('handleSingleNext called - Current step:', singleStep);

    // ALWAYS clear error at the start of validation attempt
    setError(null);

    // Validate current step before proceeding
    const stepValidation = await validateCurrentStep();
    console.log('Validation result:', stepValidation);

    if (!stepValidation.isValid) {
      console.error('Validation failed:', stepValidation.errors);
      setError(stepValidation.errors.join('\n'));
      return;
    }

    console.log('Validation passed, advancing to next step');
    if (singleStep < 5) {
      setSingleStep((singleStep + 1) as SingleStep);
    }
  }

  // Validate current step requirements
  async function validateCurrentStep(): Promise<{isValid: boolean; errors: string[]}> {
    const errors: string[] = [];

    switch (singleStep) {
      case 1: // Basic Info & Department/Role
        if (!singleEmployee.first_name?.trim()) errors.push("First name is required");
        if (!singleEmployee.last_name?.trim()) errors.push("Last name is required");
        if (!singleEmployee.email?.trim()) errors.push("Email is required");
        if (!singleEmployee.employee_number?.trim()) errors.push("Employee number is required");
        if (!singleEmployee.department_id) errors.push("Department is required");
        if (!singleEmployee.role_id) errors.push("Role is required");
        
        // Email format validation
        if (singleEmployee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(singleEmployee.email)) {
          errors.push("Invalid email format");
        }

        // Check for duplicates
        if (singleEmployee.email && existingEmails.has(singleEmployee.email.toLowerCase())) {
          errors.push("This email already exists in the system");
        }
        
        if (singleEmployee.employee_number && existingEmployeeNumbers.has(singleEmployee.employee_number)) {
          errors.push("This employee number already exists in the system");
        }
        break;
        
      case 2: // Access & Permissions
        if (!singleEmployee.access_level) errors.push("Access level is required");
        break;
        
      default:
        // Other steps don't have required validation
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  function handleSingleBack() {
    if (singleStep > 1) {
      setSingleStep((singleStep - 1) as SingleStep);
      setError(null);
    }
  }

  // Bulk employee handlers
  function addBulkEmployeeRow() {
    setBulkEmployees(prev => [...prev, getEmptyEmployee()]);
  }

  function removeBulkEmployeeRow(index: number) {
    setBulkEmployees(prev => prev.filter((_, i) => i !== index));
    setValidationResults(prev => {
      const newResults = new Map(prev);
      newResults.delete(index);
      return newResults;
    });
  }

  function handleBulkFieldChange(index: number, field: keyof NewEmployee, value: any) {
    setBulkEmployees(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      
      // Re-validate this employee with the updated data
      validateEmployee(updated[index], index).then(result => {
        setValidationResults(prevResults => {
          const newResults = new Map(prevResults);
          newResults.set(index, result);
          return newResults;
        });
      });
      
      return updated;
    });
  }

  function applyCommonSettings() {
    setBulkEmployees(prev => prev.map(emp => ({
      ...emp,
      ...(bulkCommonSettings.applyCommonRole && {
        department_id: bulkCommonSettings.commonDepartmentId,
        role_id: bulkCommonSettings.commonRoleId
      }),
      ...(bulkCommonSettings.applyCommonAccess && {
        access_level: bulkCommonSettings.commonAccessLevel
      }),
      ...(bulkCommonSettings.applyCommonPermissions && {
        permissions: bulkCommonSettings.commonPermissions
      })
    })));
  }

  // CSV Export
  function downloadBulkTemplate() {
    const headers = [
      "first_name", "last_name", "email", "employee_number",
      "start_date", "phone", "department_name", "role_name",
      "access_level", "notes"
    ];

    const exampleRow = [
      "John", "Doe", "john.doe@company.com", "EMP001",
      "2024-01-15", "555-0123", "Engineering", "Software Developer",
      "user", "New hire"
    ];

    const csv = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "new_employees_template.csv";
    a.click();
  }

  // CSV Import (simplified - you can integrate with existing UserCSVImport)
  async function handleCSVUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Parse CSV and populate bulkEmployees
    // This would integrate with your existing Papa Parse logic
    setError("CSV import integration - to be implemented with existing UserCSVImport component");
  }

  // Submit handlers
  async function createSingleEmployee() {
    console.log('createSingleEmployee called');
    setLoading(true);
    setError(null);

    try {
      console.log('Employee data:', singleEmployee);

      // Validate required fields before proceeding
      const validation = await validateEmployee(singleEmployee);
      if (!validation.isValid) {
        setError(`Please fix the following errors:\n${validation.errors.join('\n')}`);
        return;
      }

      // Generate proper UUID for both id and auth_id
      const userId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;

      console.log('Generated userId:', userId);

      const insertData = {
        id: userId,
        auth_id: userId,
        first_name: singleEmployee.first_name,
        last_name: singleEmployee.last_name,
        email: singleEmployee.email,
        employee_number: singleEmployee.employee_number,
        start_date: singleEmployee.start_date,
        phone: singleEmployee.phone,
        department_id: singleEmployee.department_id,
        role_id: singleEmployee.role_id,
        access_level: singleEmployee.access_level,
        permissions: singleEmployee.permissions,
        shift_id: singleEmployee.shift_id || null,
        manager_id: singleEmployee.manager_id || null,
        is_first_aid: singleEmployee.is_first_aid
      };

      console.log('Inserting user with data:', insertData);

      // Create user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single();

      console.log('Insert result:', { newUser, userError });

      if (userError) throw userError;

      // Fetch role assignments and create user assignments
      const { data: roleAssignments, error: roleAssignError } = await supabase
        .from("role_assignments")
        .select("item_id, type")
        .eq("role_id", singleEmployee.role_id);

      if (roleAssignError) {
        console.warn("Error fetching role assignments:", roleAssignError);
      }

      if (roleAssignments && roleAssignments.length > 0 && newUser) {
        const userAssignments = roleAssignments.map(ra => ({
          auth_id: newUser.auth_id,
          item_type: ra.type,
          item_id: ra.item_id
        }));

        const { error: assignmentError } = await supabase
          .from("user_assignments")
          .insert(userAssignments);
        
        if (assignmentError) {
          console.warn("Error creating user assignments:", assignmentError);
        }
      }

      // Send welcome email if enabled
      if (sendWelcomeEmail) {
        try {
          const dept = departments.find(d => d.id === singleEmployee.department_id);
          const role = roles.find(r => r.id === singleEmployee.role_id);

          const emailResult = await sendEmail({
            email: singleEmployee.email,
            firstName: singleEmployee.first_name,
            lastName: singleEmployee.last_name,
            employeeNumber: singleEmployee.employee_number,
            startDate: singleEmployee.start_date,
            department: dept?.name,
            role: role?.title
          });

          if (emailResult.success) {
            setSuccess(`Employee ${singleEmployee.first_name} ${singleEmployee.last_name} created successfully! Welcome email sent.`);
          } else {
            setSuccess(`Employee created but email failed: ${emailResult.error || 'Unknown email error'}`);
          }
        } catch (emailError: any) {
          console.warn("Email service error:", emailError);
          setSuccess(`Employee ${singleEmployee.first_name} ${singleEmployee.last_name} created successfully, but welcome email failed to send.`);
        }
      } else {
        setSuccess(`Employee ${singleEmployee.first_name} ${singleEmployee.last_name} created successfully!`);
      }

      // Update existing data sets for future validation
      setExistingEmails(prev => new Set([...prev, singleEmployee.email.toLowerCase()]));
      setExistingEmployeeNumbers(prev => new Set([...prev, singleEmployee.employee_number]));

      // Reset for next employee
      setTimeout(() => {
        setSingleEmployee(getEmptyEmployee());
        setSingleStep(1);
        setSuccess(null);
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createBulkEmployees() {
    setLoading(true);
    setError(null);

    try {
      // Validate all
      const allValid = await validateAllBulkEmployees();
      if (!allValid) {
        setError("Please fix validation errors before proceeding");
        return;
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
        createdEmployees: [] as any[]
      };

      // Process each employee
      for (let i = 0; i < bulkEmployees.length; i++) {
        const emp = bulkEmployees[i];

        try {
          // Generate proper UUID for both id and auth_id
          const userId = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;

          const { data: newUser, error: userError } = await supabase
            .from("users")
            .insert({
              id: userId,
              auth_id: userId,
              first_name: emp.first_name,
              last_name: emp.last_name,
              email: emp.email,
              employee_number: emp.employee_number,
              start_date: emp.start_date,
              phone: emp.phone,
              department_id: emp.department_id,
              role_id: emp.role_id,
              access_level: emp.access_level,
              permissions: emp.permissions,
              shift_id: emp.shift_id || null,
              manager_id: emp.manager_id || null,
              is_first_aid: emp.is_first_aid
            })
            .select()
            .single();

          if (userError) throw userError;

          // Assign role-based training
          if (emp.role_id && newUser) {
            const { data: roleAssignments, error: roleAssignError } = await supabase
              .from("role_assignments")
              .select("item_id, type")
              .eq("role_id", emp.role_id);

            if (roleAssignError) {
              console.warn(`Row ${i + 1}: Error fetching role assignments:`, roleAssignError);
            }

            if (roleAssignments && roleAssignments.length > 0) {
              const userAssignments = roleAssignments.map(ra => ({
                auth_id: newUser.auth_id,
                item_type: ra.type,
                item_id: ra.item_id
              }));

              const { error: assignmentError } = await supabase
                .from("user_assignments")
                .insert(userAssignments);
              
              if (assignmentError) {
                console.warn(`Row ${i + 1}: Error creating user assignments:`, assignmentError);
              }
            }
          }

          results.success++;
          results.createdEmployees.push({ ...emp, user: newUser });
        } catch (err: any) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }

      // Send welcome emails if enabled
      if (sendWelcomeEmail && results.createdEmployees.length > 0) {
        try {
          const emailData = results.createdEmployees.map(item => {
            const dept = departments.find(d => d.id === item.department_id);
            const role = roles.find(r => r.id === item.role_id);

            return {
              email: item.email,
              firstName: item.first_name,
              lastName: item.last_name,
              employeeNumber: item.employee_number,
              startDate: item.start_date,
              department: dept?.name,
              role: role?.title
            };
          });

          const emailResults = await sendBulkWelcomeEmails(emailData);

          setSuccess(
            `Created ${results.success} employees successfully. ${results.failed} failed.\n` +
            `Sent ${emailResults.successCount} welcome emails. ${emailResults.failureCount} email(s) failed.`
          );

          if (emailResults.errors.length > 0) {
            results.errors.push(...emailResults.errors.map(e => `Email to ${e.email}: ${e.error}`));
          }
        } catch (emailError: any) {
          console.warn("Bulk email service error:", emailError);
          setSuccess(`Created ${results.success} employees successfully. ${results.failed} failed.\nWelcome emails could not be sent due to service error.`);
        }
      } else {
        setSuccess(`Created ${results.success} employees successfully. ${results.failed} failed.`);
      }

      if (results.errors.length > 0) {
        setError(results.errors.join("\n"));
      }

      // Update existing data sets for future validation
      const createdEmails = results.createdEmployees.map(emp => emp.email.toLowerCase());
      const createdEmpNumbers = results.createdEmployees.map(emp => emp.employee_number);
      
      setExistingEmails(prev => new Set([...prev, ...createdEmails]));
      setExistingEmployeeNumbers(prev => new Set([...prev, ...createdEmpNumbers]));

      // Reset
      setTimeout(() => {
        setBulkEmployees([]);
        setBulkStep(1);
        setMode(null);
        setSuccess(null);
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Render helpers
  function renderModeSelection() {
    return (
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className="neon-heading text-lg mb-2">Choose Onboarding Method</h2>
          <p className="text-sm opacity-75">Select how you'd like to add employees to the system</p>
        </div>

        <div className="grid grid-auto-fit gap-6 max-w-4xl mx-auto">
          <button
            onClick={() => setMode("single")}
            className="card-container flex flex-col items-center gap-4 cursor-pointer transition hover-lift"
            style={{ boxShadow: '0 0 8px var(--neon)' }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 0 16px var(--neon)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 0 8px var(--neon)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FiUser style={{ width: '64px', height: '64px', color: 'var(--accent)' }} />
            <h3 className="neon-heading text-base mb-2">Single Employee</h3>
            <p className="text-sm text-center">
              Step-by-step wizard for adding one employee with full customization
            </p>
          </button>

          <button
            onClick={() => setMode("bulk")}
            className="card-container flex flex-col items-center gap-4 cursor-pointer transition"
            style={{ boxShadow: '0 0 8px var(--neon)' }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 0 16px var(--neon)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 0 8px var(--neon)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FiUsers style={{ width: '64px', height: '64px', color: 'var(--accent)' }} />
            <h3 className="neon-heading text-base mb-2">Bulk Import</h3>
            <p className="text-sm text-center">
              Add multiple employees at once via table entry or CSV import
            </p>
          </button>
        </div>
      </div>
    );
  }

  function renderSingleModeStep() {
    switch (singleStep) {
      case 1:
        return renderStep1BasicInfo();
      case 2:
        return renderStep3AccessPermissions();
      case 3:
        return renderStep4TrainingReview();
      case 4:
        return renderStep5AdditionalDetails();
      case 5:
        return renderStep6Review();
      default:
        return null;
    }
  }

  function renderStep1BasicInfo() {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-auto-fit gap-4">
          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="Employee's legal first name as it appears on official documents"
            >
              First Name <span className="color-error">*</span>
            </label>
            <input
              type="text"
              value={singleEmployee.first_name}
              onChange={(e) => handleSingleFieldChange("first_name", e.target.value)}
              className="neon-input"
              placeholder="e.g., John"
              required
            />
          </div>

          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="Employee's legal last name/surname"
            >
              Last Name <span className="color-error">*</span>
            </label>
            <input
              type="text"
              value={singleEmployee.last_name}
              onChange={(e) => handleSingleFieldChange("last_name", e.target.value)}
              className="neon-input"
              placeholder="e.g., Smith"
              required
            />
          </div>

          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="Work email address - must be unique in the system"
            >
              Email <span className="color-error">*</span>
            </label>
            <input
              type="email"
              value={singleEmployee.email}
              onChange={(e) => handleSingleFieldChange("email", e.target.value)}
              onBlur={async () => {
                if (singleEmployee.email) {
                  if (existingEmails.has(singleEmployee.email.toLowerCase())) {
                    setError("This email already exists in the system");
                  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(singleEmployee.email)) {
                    setError("Invalid email format");
                  } else {
                    setError(null);
                  }
                }
              }}
              className="neon-input"
              placeholder="e.g., john.smith@company.com"
              required
            />
          </div>

          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="Unique identifier for this employee - must be unique across all employees (active and inactive)"
            >
              Employee Number <span className="color-error">*</span>
            </label>
            <input
              type="text"
              value={singleEmployee.employee_number}
              onChange={(e) => {
                handleSingleFieldChange("employee_number", e.target.value);
                // Clear error when user starts typing
                if (error?.includes("employee number")) {
                  setError(null);
                }
              }}
              onBlur={async () => {
                if (singleEmployee.employee_number?.trim()) {
                  if (existingEmployeeNumbers.has(singleEmployee.employee_number.trim())) {
                    setError("This employee number is not available. It's already assigned to another employee in the system.");
                  }
                }
              }}
              className="neon-input"
              placeholder="e.g., EMP001"
              style={{
                borderColor: (singleEmployee.employee_number && existingEmployeeNumbers.has(singleEmployee.employee_number.trim())) ? '#ea1c1c' : undefined
              }}
              required
            />
            {singleEmployee.employee_number && existingEmployeeNumbers.has(singleEmployee.employee_number.trim()) && (
              <p className="text-xs color-error mt-1 flex items-center gap-1">
                <FiAlertCircle className="flex-shrink-0" />
                This employee number is already in use
              </p>
            )}
          </div>

          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="First day of employment - used for training assignment scheduling"
            >
              Start Date <span className="color-error">*</span>
            </label>
            <input
              type="date"
              value={singleEmployee.start_date}
              onChange={(e) => handleSingleFieldChange("start_date", e.target.value)}
              className="neon-input"
              required
            />
          </div>

          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="Contact phone number (optional)"
            >
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={singleEmployee.phone}
              onChange={(e) => handleSingleFieldChange("phone", e.target.value)}
              className="neon-input"
              placeholder="e.g., +44 20 1234 5678"
            />
          </div>

          {/* Department & Role Section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="border-t pt-6 mt-6">
              <h4 className="neon-heading text-sm mb-4">Department & Role</h4>
              <div className="grid grid-auto-fit gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="custom-tooltip-trigger neon-form-label text-xs"
                      data-tooltip="Employee's organizational department - automatically assigns department-wide training"
                    >
                      Department <span className="color-error">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCreateDepartment(true)}
                      className="custom-tooltip-trigger text-xs font-bold no-underline cursor-pointer"
                      data-tooltip="Create a new department if not listed"
                      style={{
                        color: 'var(--accent)',
                        background: 'none',
                        border: 'none',
                        textDecoration: 'underline'
                      }}
                    >
                      + Create New
                    </button>
                  </div>
                  <select
                    value={singleEmployee.department_id}
                    onChange={(e) => {
                      handleSingleFieldChange("department_id", e.target.value);
                      handleSingleFieldChange("role_id", ""); // Reset role when department changes
                    }}
                    className="neon-input"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {departments.length === 0 && (
                    <p className="text-xs mt-2 opacity-75">
                      No departments available. Create one to continue.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="custom-tooltip-trigger neon-form-label text-xs"
                      data-tooltip="Employee's job role - automatically assigns role-specific training modules"
                    >
                      Role <span className="color-error">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCreateRole(true)}
                      disabled={!singleEmployee.department_id}
                      className="custom-tooltip-trigger text-xs font-bold"
                      data-tooltip={!singleEmployee.department_id ? "Select a department first" : "Create a new role if not listed"}
                      style={{
                        color: singleEmployee.department_id ? 'var(--accent)' : '#666',
                        background: 'none',
                        border: 'none',
                        cursor: singleEmployee.department_id ? 'pointer' : 'not-allowed',
                        textDecoration: 'underline'
                      }}
                    >
                      + Create New
                    </button>
                  </div>
                  <select
                    value={singleEmployee.role_id}
                    onChange={(e) => handleSingleFieldChange("role_id", e.target.value)}
                    className="neon-input"
                    disabled={!singleEmployee.department_id}
                    required
                  >
                    <option value="">Select Role</option>
                    {singleEmployee.department_id && roles
                      .filter(r => r.department_id === singleEmployee.department_id)
                      .map(role => (
                        <option key={role.id} value={role.id}>{role.title}</option>
                      ))}
                  </select>
                  {!singleEmployee.department_id && (
                    <p className="text-xs mt-2 opacity-75">Select a department first</p>
                  )}
                  {singleEmployee.department_id && roles.filter(r => r.department_id === singleEmployee.department_id).length === 0 && (
                    <p className="text-xs mt-2 opacity-75">
                      No roles available for this department. Create one to continue.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep2DepartmentRole() {
    const filteredRoles = singleEmployee.department_id
      ? roles.filter(r => r.department_id === singleEmployee.department_id)
      : roles;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Department & Role</h3>
          <p className="text-gray-600 mb-6">Assign department and role - this will auto-assign required training</p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCreateDepartment(true)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                + Create New
              </button>
            </div>
            <select
              value={singleEmployee.department_id}
              onChange={(e) => {
                handleSingleFieldChange("department_id", e.target.value);
                handleSingleFieldChange("role_id", ""); // Reset role when department changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            {departments.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No departments available. Create one to continue.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCreateRole(true)}
                disabled={!singleEmployee.department_id}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                + Create New
              </button>
            </div>
            <select
              value={singleEmployee.role_id}
              onChange={(e) => handleSingleFieldChange("role_id", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={!singleEmployee.department_id}
              required
            >
              <option value="">Select Role</option>
              {filteredRoles.map(role => (
                <option key={role.id} value={role.id}>{role.title}</option>
              ))}
            </select>
            {!singleEmployee.department_id && (
              <p className="text-sm text-gray-500 mt-1">Select a department first</p>
            )}
            {singleEmployee.department_id && filteredRoles.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No roles available for this department. Create one to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderStep3AccessPermissions() {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="System access level determines what features the employee can access - User (basic), Manager (team oversight), or Admin (full system)"
            >
              Access Level <span className="color-error">*</span>
            </label>
            <select
              value={singleEmployee.access_level}
              onChange={(e) => handleSingleFieldChange("access_level", e.target.value)}
              className="neon-input"
              required
            >
              {ACCESS_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-4"
              data-tooltip="Grant additional system capabilities beyond the base access level"
            >
              Additional Permissions
            </label>
            <div className="flex flex-col gap-3">
              {PERMISSION_OPTIONS.map(perm => (
                <label
                  key={perm.id}
                  className="flex items-start gap-3 p-3 border-neon rounded-lg cursor-pointer transition"
                  style={{ background: 'var(--field)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(64, 224, 208, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--field)'}
                >
                  <input
                    type="checkbox"
                    checked={singleEmployee.permissions.includes(perm.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSingleFieldChange("permissions", [...singleEmployee.permissions, perm.id]);
                      } else {
                        handleSingleFieldChange("permissions", singleEmployee.permissions.filter(p => p !== perm.id));
                      }
                    }}
                    style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: 'var(--neon)' }}
                  />
                  <div>
                    <p className="font-bold text-xs mb-1">{perm.label}</p>
                    <p className="text-xs opacity-75">{perm.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep4TrainingReview() {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="neon-heading text-base mb-4">Training Assignment Preview</h3>
          <p className="main-subheader mb-6">These training modules will be automatically assigned based on the selected role</p>
        </div>

        <div className="bg-info-light border-2 rounded-lg p-4 flex items-center gap-2" style={{ borderColor: '#0ea5e9' }}>
          <FiAlertCircle className="flex-shrink-0" />
          <p className="text-xs">
            Role-based training will be assigned automatically upon employee creation
          </p>
        </div>

        <div className="text-center py-8 text-xs">
          Training assignments for role: <strong className="neon-heading">{roles.find(r => r.id === singleEmployee.role_id)?.title}</strong>
        </div>
      </div>
    );
  }

  function renderStep5AdditionalDetails() {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="Direct manager/supervisor for this employee - used for reporting hierarchy and approvals"
            >
              Manager (Optional)
            </label>
            <select
              value={singleEmployee.manager_id}
              onChange={(e) => handleSingleFieldChange("manager_id", e.target.value)}
              className="neon-input"
            >
              <option value="">Select Manager</option>
              {managers.map(mgr => (
                <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="custom-tooltip-trigger flex items-center gap-2 cursor-pointer"
              data-tooltip="Mark if employee is a certified first aider - displayed in emergency contact lists"
            >
              <input
                type="checkbox"
                checked={singleEmployee.is_first_aid}
                onChange={(e) => handleSingleFieldChange("is_first_aid", e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--neon)' }}
              />
              <span className="text-xs font-bold">First Aider</span>
            </label>
          </div>

          <div>
            <label
              className="custom-tooltip-trigger neon-form-label text-xs mb-2"
              data-tooltip="Internal notes about this employee - visible only to admins"
            >
              Notes (Optional)
            </label>
            <textarea
              value={singleEmployee.notes}
              onChange={(e) => handleSingleFieldChange("notes", e.target.value)}
              className="neon-input"
              rows={4}
              placeholder="Any additional notes about this employee..."
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep6Review() {
    const selectedDept = departments.find(d => d.id === singleEmployee.department_id);
    const selectedRole = roles.find(r => r.id === singleEmployee.role_id);
    const selectedManager = managers.find(m => m.id === singleEmployee.manager_id);
    const selectedAccessLevel = ACCESS_LEVELS.find(l => l.value === singleEmployee.access_level);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Review & Confirm</h3>
          <p className="text-gray-600 mb-6">Please review all information before creating the employee</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{singleEmployee.first_name} {singleEmployee.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{singleEmployee.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Employee Number</p>
              <p className="font-medium">{singleEmployee.employee_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium">{singleEmployee.start_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{selectedDept?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium">{selectedRole?.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Access Level</p>
              <p className="font-medium">{selectedAccessLevel?.label}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Manager</p>
              <p className="font-medium">{selectedManager?.name || "None"}</p>
            </div>
          </div>

          {singleEmployee.permissions.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {singleEmployee.permissions.map(permId => {
                  const perm = PERMISSION_OPTIONS.find(p => p.id === permId);
                  return (
                    <span key={permId} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                      {perm?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Email Invitation Option */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWelcomeEmail}
              onChange={(e) => setSendWelcomeEmail(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mt-1"
            />
            <div>
              <p className="font-medium text-blue-900">Send Welcome Email</p>
              <p className="text-sm text-blue-700 mt-1">
                Send an email invitation to {singleEmployee.email} with account setup instructions and a password reset link
              </p>
            </div>
          </label>
        </div>
      </div>
    );
  }

  function renderBulkMode() {
    if (!bulkMethod) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Bulk Import Method</h3>
            <p className="text-gray-600 mb-6">Choose how you'd like to enter employee data</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => {
                setBulkMethod("manual");
                setBulkEmployees([getEmptyEmployee()]);
              }}
              className="bg-white border-2 border-gray-200 hover:border-orange-500 rounded-lg p-6 transition-all hover:shadow-lg"
            >
              <FiEdit3 className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h4 className="text-lg font-semibold mb-2">Manual Entry</h4>
              <p className="text-gray-600 text-sm">
                Enter employee data using a table interface (2-10 employees)
              </p>
            </button>

            <button
              onClick={() => {
                setBulkMethod("paste");
              }}
              className="bg-white border-2 border-gray-200 hover:border-orange-500 rounded-lg p-6 transition-all hover:shadow-lg"
            >
              <FiClipboard className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h4 className="text-lg font-semibold mb-2">Paste from Spreadsheet</h4>
              <p className="text-gray-600 text-sm">
                Copy & paste directly from Excel or Google Sheets
              </p>
            </button>

            <button
              onClick={() => {
                setBulkMethod("csv");
              }}
              className="bg-white border-2 border-gray-200 hover:border-orange-500 rounded-lg p-6 transition-all hover:shadow-lg"
            >
              <FiUpload className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h4 className="text-lg font-semibold mb-2">CSV Upload</h4>
              <p className="text-gray-600 text-sm">
                Upload a CSV file with employee data (10+ employees)
              </p>
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={downloadBulkTemplate}
              className="text-orange-600 hover:text-orange-700 flex items-center gap-2 mx-auto"
            >
              <FiDownload />
              Download CSV Template
            </button>
          </div>
        </div>
      );
    }

    // Render bulk steps based on method
    return renderBulkSteps();
  }

  async function lookupDepartmentAndRole(departmentName?: string, roleName?: string) {
    let deptId = "";
    let roleId = "";

    if (departmentName) {
      const dept = departments.find(d =>
        d.name.toLowerCase() === departmentName.toLowerCase()
      );
      if (dept) deptId = dept.id;
    }

    if (roleName && deptId) {
      const role = roles.find(r =>
        r.title.toLowerCase() === roleName.toLowerCase() && r.department_id === deptId
      );
      if (role) roleId = role.id;
    }

    return { deptId, roleId };
  }

  async function handlePasteImport(pastedEmployees: any[]) {
    // Convert pasted employees to NewEmployee format with department/role lookup
    const convertedEmployees: NewEmployee[] = await Promise.all(
      pastedEmployees.map(async emp => {
        const { deptId, roleId } = await lookupDepartmentAndRole(
          emp.department_name,
          emp.role_name
        );

        return {
          first_name: emp.first_name || "",
          last_name: emp.last_name || "",
          email: emp.email || "",
          employee_number: emp.employee_number || "",
          start_date: emp.start_date || new Date().toISOString().split('T')[0],
          phone: emp.phone || "",
          department_id: deptId,
          role_id: roleId,
          access_level: emp.access_level || "user",
          permissions: [],
          shift_id: "",
          manager_id: "",
          is_first_aid: false,
          notes: "",
          _validationErrors: [],
          _isValid: false
        };
      })
    );

    setBulkEmployees(convertedEmployees);
    setBulkStep(2); // Move to review step
  }

  async function handleCSVImport(csvEmployees: any[]) {
    // Convert CSV employees to NewEmployee format with department/role lookup
    const convertedEmployees: NewEmployee[] = await Promise.all(
      csvEmployees.map(async emp => {
        const { deptId, roleId } = await lookupDepartmentAndRole(
          emp.department_name,
          emp.role_name
        );

        return {
          first_name: emp.first_name || "",
          last_name: emp.last_name || "",
          email: emp.email || "",
          employee_number: emp.employee_number || "",
          start_date: emp.start_date || new Date().toISOString().split('T')[0],
          phone: emp.phone || "",
          department_id: deptId,
          role_id: roleId,
          access_level: emp.access_level || "user",
          permissions: [],
          shift_id: "",
          manager_id: "",
          is_first_aid: false,
          notes: "",
          _validationErrors: [],
          _isValid: false
        };
      })
    );

    setBulkEmployees(convertedEmployees);
    setBulkStep(2); // Move to review step
  }

  async function handleManualEntry(manualEmployees: any[]) {
    // Manual employees already have department_id and role_id
    const convertedEmployees: NewEmployee[] = manualEmployees.map(emp => ({
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      email: emp.email || "",
      employee_number: emp.employee_number || "",
      start_date: emp.start_date || new Date().toISOString().split('T')[0],
      phone: emp.phone || "",
      department_id: emp.department_id || "",
      role_id: emp.role_id || "",
      access_level: emp.access_level || "user",
      permissions: [],
      shift_id: "",
      manager_id: "",
      is_first_aid: false,
      notes: "",
      _validationErrors: [],
      _isValid: true
    }));

    setBulkEmployees(convertedEmployees);
    setBulkStep(2); // Move to review step
  }

  function renderBulkSteps() {
    // Step 1: Data entry based on method
    if (bulkStep === 1) {
      if (bulkMethod === "paste") {
        return (
          <PasteEmployeeData
            onImport={handlePasteImport}
            onCancel={() => {
              setBulkMethod(null);
              setBulkEmployees([]);
            }}
          />
        );
      }

      if (bulkMethod === "csv") {
        return (
          <CSVEmployeeUpload
            existingEmails={existingEmails}
            existingEmployeeNumbers={existingEmployeeNumbers}
            onImport={handleCSVImport}
            onCancel={() => {
              setBulkMethod(null);
              setBulkEmployees([]);
            }}
          />
        );
      }

      if (bulkMethod === "manual") {
        return (
          <ManualBulkEntry
            departments={departments}
            roles={roles}
            existingEmails={existingEmails}
            existingEmployeeNumbers={existingEmployeeNumbers}
            onComplete={handleManualEntry}
            onCancel={() => {
              setBulkMethod(null);
              setBulkEmployees([]);
            }}
          />
        );
      }
    }

    // Step 2: Review and create all
    if (bulkStep === 2) {
      return renderBulkReview();
    }

    return null;
  }

  function renderBulkReview() {
    const employeesWithMissingDept = bulkEmployees.filter(emp => !emp.department_id);
    const employeesWithMissingRole = bulkEmployees.filter(emp => !emp.role_id);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Review Bulk Import</h3>
          <p className="text-gray-600">Review all employees before creating them in the system</p>
        </div>

        {(employeesWithMissingDept.length > 0 || employeesWithMissingRole.length > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 mb-2">
              <FiAlertCircle className="inline mr-2" />
              <strong>Warning:</strong> Some employees are missing department or role assignments
            </p>
            {employeesWithMissingDept.length > 0 && (
              <p className="text-sm text-yellow-700">
                • {employeesWithMissingDept.length} employee(s) without department
              </p>
            )}
            {employeesWithMissingRole.length > 0 && (
              <p className="text-sm text-yellow-700">
                • {employeesWithMissingRole.length} employee(s) without role
              </p>
            )}
            <p className="text-sm text-yellow-700 mt-2">
              These employees will need department/role assigned manually after creation.
            </p>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <FiCheck className="inline mr-2" />
            Ready to create <strong>{bulkEmployees.length}</strong> employee{bulkEmployees.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Employee List */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Emp #</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Department</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Role</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bulkEmployees.map((emp, index) => {
                  const dept = departments.find(d => d.id === emp.department_id);
                  const role = roles.find(r => r.id === emp.role_id);

                  return (
                    <tr key={index} className="bg-white hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                      <td className="px-3 py-2">{emp.first_name} {emp.last_name}</td>
                      <td className="px-3 py-2">{emp.email}</td>
                      <td className="px-3 py-2">{emp.employee_number}</td>
                      <td className="px-3 py-2">
                        {dept ? dept.name : <span className="text-yellow-600">Not assigned</span>}
                      </td>
                      <td className="px-3 py-2">
                        {role ? role.title : <span className="text-yellow-600">Not assigned</span>}
                      </td>
                      <td className="px-3 py-2 capitalize">{emp.access_level}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Email Invitation Option */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWelcomeEmail}
              onChange={(e) => setSendWelcomeEmail(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mt-1"
            />
            <div>
              <p className="font-medium text-blue-900">Send Welcome Emails to All Employees</p>
              <p className="text-sm text-blue-700 mt-1">
                Send email invitations with account setup instructions and password reset links to all {bulkEmployees.length} employees
              </p>
            </div>
          </label>
        </div>
      </div>
    );
  }

  function renderNavigation() {
    if (!mode) return null;

    const isLastStep = mode === "single" ? singleStep === 5 : bulkStep === 4;

    return (
      <div className="flex justify-between items-center pt-6 border-t mt-8">
        <NeonIconButton
          variant="back"
          title="Go back to previous step"
          onClick={() => {
            if (mode === "single" && singleStep === 1) {
              setMode(null);
            } else if (mode === "bulk" && bulkStep === 1 && !bulkMethod) {
              setMode(null);
            } else {
              mode === "single" ? handleSingleBack() : setBulkStep((bulkStep - 1) as BulkStep);
            }
          }}
        />

        {mode === "single" && (
          <div className="text-xs font-bold">
            Step {singleStep} of 5
          </div>
        )}

        {isLastStep ? (
          <NeonIconButton
            variant="save"
            title={`Create ${mode === "bulk" ? "all employees" : "employee"}`}
            disabled={loading}
            onClick={async (e) => {
              e.preventDefault();
              console.log('Save button clicked', { mode, singleStep, isLastStep, loading });

              if (loading) {
                console.log('Button click ignored - already loading');
                return;
              }

              console.log('Last step - creating employee(s)');
              if (mode === "single") {
                await createSingleEmployee();
              } else {
                await createBulkEmployees();
              }
            }}
            style={{
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          />
        ) : (
          <NeonIconButton
            variant="next"
            title="Continue to next step"
            type="button"
            disabled={loading}
            onClick={async (e) => {
              e.preventDefault();
              console.log('Next button clicked', { mode, singleStep, isLastStep, loading });

              if (loading) {
                console.log('Button click ignored - already loading');
                return;
              }

              if (mode === "single") {
                console.log('Single mode - calling handleSingleNext');
                await handleSingleNext();
              } else {
                console.log('Bulk mode - advancing step');
                setBulkStep((bulkStep + 1) as BulkStep);
              }
            }}
            style={{
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <MainHeader
        title="Employee Onboarding"
        subtitle="Add new employees individually or in bulk with automated training assignment"
      />

      <main className="page-container">
        {!mode && renderModeSelection()}

        {mode && (
          <div className="neon-panel">
            {error && (
              <div className="error-box mb-6 flex items-start gap-3 shadow-lg">
                <FiAlertCircle className="flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-bold neon-heading mb-2">Validation Error</p>
                  <div className="text-xs" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
                </div>
              </div>
            )}

            {success && (
              <div className="success-box mb-6 flex items-center gap-3 shadow-lg">
                <FiCheck />
                <span className="text-xs">{success}</span>
              </div>
            )}

            {mode === "single" && renderSingleModeStep()}
            {mode === "bulk" && renderBulkMode()}

            {renderNavigation()}
          </div>
        )}
      </main>

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={showCreateDepartment}
        onClose={() => setShowCreateDepartment(false)}
        onSuccess={(newDepartment) => {
          try {
            setDepartments(prev => [...prev, newDepartment]);
            if (mode === "single") {
              handleSingleFieldChange("department_id", newDepartment.id);
            }
            setSuccess(`Department "${newDepartment.name}" created successfully!`);
            setTimeout(() => setSuccess(null), 3000);
          } catch (err: any) {
            console.error("Error handling department creation:", err);
            setError("Department created but failed to update form.");
          }
        }}
      />

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={showCreateRole}
        onClose={() => setShowCreateRole(false)}
        preSelectedDepartmentId={singleEmployee.department_id}
        onSuccess={(newRole) => {
          try {
            setRoles(prev => [...prev, newRole]);
            if (mode === "single") {
              handleSingleFieldChange("role_id", newRole.id);
            }
            setSuccess(`Role "${newRole.title}" created successfully!`);
            setTimeout(() => setSuccess(null), 3000);
          } catch (err: any) {
            console.error("Error handling role creation:", err);
            setError("Role created but failed to update form.");
          }
        }}
      />
    </>
  );
}
