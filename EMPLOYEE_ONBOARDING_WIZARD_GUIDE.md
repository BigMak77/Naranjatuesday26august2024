# Employee Onboarding Wizard - Complete Guide

## Overview
The Employee Onboarding Wizard is a comprehensive system for adding new employees to your organization. It supports both single and bulk employee creation with automated training assignment and email invitations.

## Access
Navigate to: `/admin/onboarding`

## Features

### 🎯 Single Employee Mode
Step-by-step wizard for adding one employee with full customization.

**6 Steps:**
1. **Basic Information** - Name, email, employee number, start date, phone
2. **Department & Role** - Auto-assigns training based on role selection
3. **Access & Permissions** - System access levels and special permissions
4. **Training Review** - Preview auto-assigned training modules
5. **Additional Details** - Manager, first aider status, notes
6. **Review & Confirm** - Final summary with email invitation option

### 👥 Bulk Import Mode
Three methods for adding multiple employees at once.

#### Method 1: Manual Table Entry
- Interactive table interface
- Real-time validation
- Ideal for 2-10 employees
- "Copy from Previous" feature for common fields
- Inline error display

#### Method 2: Paste from Spreadsheet ⭐ NEW!
- Copy directly from Excel or Google Sheets
- Smart column detection and mapping
- Auto-detects delimiter (tabs vs commas)
- 3-step process:
  1. **Paste** - Paste your data
  2. **Map Columns** - Verify/adjust column mappings
  3. **Preview** - Review and import

**Column Mapping Intelligence:**
- Automatically detects common column names
- Infers data types from content
- Manual override available
- Confidence indicators (high/medium/low)

#### Method 3: CSV Upload
- Upload CSV file with employee data
- Template download available
- Batch validation and preview
- Handles large datasets (50+ employees)

## Validation Features

### ✅ Uniqueness Checks
- **Email addresses** - Validated against existing system emails
- **Employee numbers** - Checked for duplicates in database
- **Batch duplicates** - Detects duplicates within the import batch
- **Real-time feedback** - Instant validation as you type

### ✅ Data Validation
- Email format validation
- Required field checking
- Date format conversion (DD/MM/YYYY → YYYY-MM-DD)
- Phone number format
- Access level validation

## Department & Role Lookup

### Automatic Mapping
When importing via paste or CSV with department/role names:
- System automatically looks up department by name
- Finds matching role within that department
- Case-insensitive matching
- Falls back to manual assignment if not found

### Training Auto-Assignment
Upon role selection:
- Automatically fetches role-based training assignments
- Creates `user_assignments` records for all modules/documents
- Links to existing `role_assignments` system
- No manual intervention required

## Email Invitation System

### Welcome Emails
**Enabled by default** - Can be toggled before creation

**Single Mode:**
- Checkbox on final review step
- Sends invitation with magic link
- Includes employee details (name, employee #, start date, department, role)

**Bulk Mode:**
- Checkbox on bulk review step
- Batch processing (5 emails at a time to avoid rate limits)
- Detailed success/failure reporting
- Individual error tracking per email

**Email Contents:**
- Welcome message with company info
- Account setup instructions
- Magic link for password creation
- Employee details summary

### Fallback Options
If email sending fails:
- Employee is still created successfully
- Clear error message displayed
- Option to resend manually later
- Temporary password generation available

## Data Flow

### Single Employee Creation
```
1. User fills 6-step wizard
2. Validation on each step
3. Final review with all data
4. Create user record in database
5. Fetch role_assignments for selected role
6. Create user_assignments for training
7. Send welcome email (if enabled)
8. Success confirmation
```

### Bulk Employee Creation
```
1. User selects import method (manual/paste/CSV)
2. Data entry/import
3. Validation & department/role lookup
4. Review all employees
5. Batch creation:
   - Create user records
   - Assign training for each
   - Collect results
6. Send welcome emails in batches (if enabled)
7. Summary report (success/failure counts)
```

## CSV File Format

### Required Columns
- `first_name`
- `last_name`
- `email`
- `employee_number`

### Optional Columns
- `start_date` (YYYY-MM-DD or DD/MM/YYYY)
- `phone`
- `department_name` (will be auto-matched to department_id)
- `role_name` (will be auto-matched to role_id)
- `access_level` (user/manager/admin/super_admin)

### Example CSV
```csv
first_name,last_name,email,employee_number,start_date,department_name,role_name,access_level
John,Doe,john.doe@company.com,EMP001,2024-01-15,Engineering,Software Developer,user
Jane,Smith,jane.smith@company.com,EMP002,2024-01-20,Marketing,Marketing Manager,manager
```

## Access Levels

| Level | Description |
|-------|-------------|
| `user` | Standard employee access |
| `manager` | Department manager access |
| `admin` | System administrator |
| `super_admin` | Full system access |

## Special Permissions

| Permission | Description |
|------------|-------------|
| `trainer` | Can record training completions for others |
| `health_safety_manager` | Full Health & Safety module access |
| `task_manager` | Create and assign tasks |
| `report_viewer` | View all system reports |
| `audit_manager` | Manage audits and compliance |

## Error Handling

### Validation Errors
- **Inline display** - Errors shown next to fields
- **Summary view** - All errors listed at bottom
- **Row tracking** - Error messages include row numbers
- **Continue with valid** - Can proceed with valid entries only

### Database Errors
- **Transaction safety** - Each employee is independent
- **Partial success** - Some employees can succeed while others fail
- **Error reporting** - Detailed error messages for each failure
- **Retry logic** - Failed employees can be re-imported

### Email Errors
- **Non-blocking** - Email failure doesn't prevent employee creation
- **Detailed logging** - Which emails failed and why
- **Batch tracking** - Success/failure counts reported

## Best Practices

### For Single Employees
1. Use when adding 1-2 employees
2. Need full customization
3. Want to review all options
4. Special permissions required

### For Bulk Import - Manual Entry
1. 2-10 employees
2. Direct data entry
3. Common roles/departments
4. Use "Copy from Previous" for efficiency

### For Bulk Import - Paste from Spreadsheet
1. Data already in Excel/Google Sheets
2. Quick ad-hoc imports
3. 5-50 employees
4. No need to save/export CSV

### For Bulk Import - CSV Upload
1. 10+ employees
2. Regular bulk imports
3. Data from other systems
4. Need to keep audit trail of import files

## Tips & Tricks

### Speed Up Bulk Entry
- Use "Copy from Previous" in manual table
- Prepare spreadsheet template in advance
- Use consistent naming for departments/roles
- Include all optional fields for complete profiles

### Avoid Common Errors
- **Employee numbers** - Ensure they're unique before import
- **Email addresses** - Check for typos (common source of failures)
- **Date formats** - Use YYYY-MM-DD for best compatibility
- **Department/role names** - Must match exactly (case-insensitive)

### Maximize Success Rate
1. Download and review the CSV template
2. Validate email addresses externally first
3. Check for duplicate employee numbers
4. Ensure department/role names match system
5. Test with 2-3 employees first

## Troubleshooting

### "Email already exists"
- Check if employee was previously added
- Look in archived/inactive employees
- Contact admin to remove duplicate

### "Employee number already exists"
- Use system to find existing employee with that number
- Assign new employee a different number
- Check for typos in employee number

### "Department/Role not found"
- Exact name doesn't match system
- Will be left blank for manual assignment later
- Check department/role lists in system
- Use manual entry method for precise selection

### "Welcome email failed"
- Employee still created successfully
- Email may be invalid/bouncing
- Check email service configuration
- Can resend invitation manually

### "Some employees failed to create"
- Review error messages for each failure
- Common causes: duplicate data, missing required fields
- Fix issues and re-import failed employees
- Successfully created employees don't need re-import

## Technical Details

### Components
- **NewEmployeeWizard.tsx** - Main wizard orchestration
- **PasteEmployeeData.tsx** - Spreadsheet paste functionality
- **ManualBulkEntry.tsx** - Table-based data entry
- **CSVEmployeeUpload.tsx** - CSV file upload and parsing
- **email-service.ts** - Email invitation service

### Database Tables
- **users** - Employee records
- **user_assignments** - Training assignments
- **role_assignments** - Role-based training templates
- **departments** - Department definitions
- **roles** - Role definitions

### API Calls
- `supabase.from('users').insert()` - Create employee
- `supabase.from('role_assignments').select()` - Get training for role
- `supabase.from('user_assignments').insert()` - Assign training
- `supabase.auth.admin.inviteUserByEmail()` - Send email invitation

## Future Enhancements

Potential improvements:
- ✨ Batch edit after import preview
- ✨ Save import templates for recurring needs
- ✨ Integration with HRIS systems
- ✨ Bulk manager assignment
- ✨ Custom email templates
- ✨ Import history and audit log
- ✨ Scheduled start date automation
- ✨ Equipment/assets assignment

## Support

For issues or questions:
1. Check this guide first
2. Review error messages carefully
3. Test with small batch first
4. Contact system administrator
5. Submit bug report with:
   - Steps to reproduce
   - Error messages
   - Number of employees
   - Import method used

---

**Version:** 1.0
**Last Updated:** 2024
**Component Path:** `/src/components/admin/NewEmployeeWizard.tsx`
**Page Route:** `/admin/onboarding`
