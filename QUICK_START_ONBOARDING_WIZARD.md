# 🚀 Quick Start - Employee Onboarding Wizard

## Access
**URL:** `/admin/onboarding`

## Choose Your Method

### 👤 Single Employee
**When to use:** Adding 1-2 employees with full customization

**Steps:**
1. Click "Single Employee"
2. Fill 6-step wizard
3. Review and confirm
4. Toggle email invitation (on by default)
5. Click "Create Employee"

**Time:** ~2-3 minutes per employee

---

### 📝 Manual Table Entry
**When to use:** 2-10 employees, direct data entry

**Steps:**
1. Click "Bulk Import" → "Manual Entry"
2. Fill table rows (use "Copy from Previous" for speed)
3. Click "Add Row" as needed
4. Click "Continue with X Employees"
5. Review and confirm
6. Toggle email invitations
7. Click "Create All"

**Time:** ~5-10 minutes for 10 employees

---

### 📋 Paste from Spreadsheet ⭐
**When to use:** Data already in Excel/Google Sheets

**Steps:**
1. Open your spreadsheet
2. Select all data including headers
3. Copy (Ctrl+C / Cmd+C)
4. Click "Bulk Import" → "Paste from Spreadsheet"
5. Paste into textarea (Ctrl+V / Cmd+V)
6. Review auto-detected columns
7. Adjust mappings if needed
8. Click "Preview Import"
9. Review validation
10. Click "Import X Employees"

**Time:** ~2-5 minutes for any size batch

**Columns needed:**
- first_name, last_name
- email, employee_number
- Optional: start_date, phone, department_name, role_name

---

### 📄 CSV Upload
**When to use:** 10+ employees, regular imports

**Steps:**
1. Click "Download CSV Template"
2. Fill template with employee data
3. Save as CSV
4. Click "Bulk Import" → "CSV Upload"
5. Select your CSV file
6. Click "Parse & Preview"
7. Review validation results
8. Click "Import X Employees"

**Time:** ~5-10 minutes + data prep time

---

## Quick Tips

### ✅ Required Fields
- First Name
- Last Name
- Email (must be unique)
- Employee Number (must be unique)
- Department
- Role

### 🎯 Auto-Assignment
- Training modules assigned automatically based on role
- No manual training assignment needed
- All role-based modules/documents created instantly

### 📧 Email Invitations
- **Enabled by default** ✓
- Sends magic link for password setup
- Includes employee details
- Non-blocking (employee still created if email fails)

### 🔍 Smart Validation
- Real-time duplicate checking
- Email format validation
- Required field checking
- Inline error display

### ⚡ Speed Hacks
**Manual Entry:**
- Use "Copy from Previous" button
- Fill common fields first

**Paste from Spreadsheet:**
- Include headers in first row
- Use consistent column names
- Copy directly from Excel/Sheets

**CSV Upload:**
- Use provided template
- Match department/role names exactly
- Keep file under 50MB

---

## Common Issues & Fixes

### ❌ "Email already exists"
**Fix:** Check if employee was previously added, use different email

### ❌ "Employee number already exists"
**Fix:** Choose a unique employee number

### ❌ "Department/Role not found" (paste/CSV only)
**Fix:**
- Check spelling of department/role names
- Names must match exactly (case-insensitive)
- Or use manual entry method

### ⚠️ "Welcome email failed"
**Fix:** Employee still created successfully, can resend manually

---

## Validation Indicators

| Icon | Meaning |
|------|---------|
| ✅ | Valid - ready to import |
| ❌ | Error - fix before importing |
| ⚠️ | Warning - optional data missing |
| 🟢 | Valid row |
| 🔴 | Error in row |

---

## Bulk Import Comparison

| Feature | Manual | Paste | CSV |
|---------|--------|-------|-----|
| Best for | 2-10 | 5-50 | 10-500+ |
| Data prep | None | Minimal | Template |
| Speed | Medium | Fast | Medium |
| Flexibility | High | Medium | Medium |
| Learning curve | Low | Low | Medium |

---

## Access Levels

| Level | Use For |
|-------|---------|
| **User** | Standard employees |
| **Manager** | Department managers |
| **Admin** | System administrators |
| **Super Admin** | Full access |

---

## Special Permissions

- **Trainer** - Record training for others
- **Health & Safety Manager** - H&S module access
- **Task Manager** - Create and assign tasks
- **Report Viewer** - View all reports
- **Audit Manager** - Manage audits

---

## Success Checklist

Before submitting:
- [ ] All required fields filled
- [ ] No duplicate emails
- [ ] No duplicate employee numbers
- [ ] Department and role selected
- [ ] Email invitation toggle set
- [ ] Review validation status
- [ ] Check row count

---

## Need Help?

📖 **Full Documentation:** `EMPLOYEE_ONBOARDING_WIZARD_GUIDE.md`

🔧 **Technical Details:** `ONBOARDING_WIZARD_IMPLEMENTATION_SUMMARY.md`

💬 **Support:** Contact system administrator

---

**Quick Navigation:**
- [Full User Guide](./EMPLOYEE_ONBOARDING_WIZARD_GUIDE.md)
- [Implementation Summary](./ONBOARDING_WIZARD_IMPLEMENTATION_SUMMARY.md)
- [Main Wizard](.../src/components/admin/NewEmployeeWizard.tsx)
