# CSV Import/Export Guide for User Assignments

## Overview
The TrainerView component now includes CSV export and import functionality for managing user assignments with training dates and evidence.

## Export CSV Functionality

### How to Export
1. Navigate to the Trainer View page
2. Click the **"Export CSV"** button (with archive icon)
3. A CSV file will be automatically downloaded with the filename format: `user_assignments_YYYY-MM-DD.csv`

### CSV Export Structure
The exported CSV includes the following columns:

| Column Name | Description | Example |
|-------------|-------------|---------|
| `assignment_id` | Unique ID of the assignment | `12345` |
| `user_auth_id` | User's authentication ID | `abc123...` |
| `user_name` | Full name of the user | `John Doe` |
| `user_email` | User's email address | `john@company.com` |
| `item_type` | Type of assignment | `module` or `document` |
| `item_id` | ID of the assigned item | `mod_001` |
| `item_name` | Name of the assigned item | `Safety Training Module` |
| `assigned_at` | Date when assigned | `2024-10-14` |
| `completed_at` | Date when completed (if any) | `2024-10-15` or empty |
| `training_date` | **PLACEHOLDER** - For manual entry | Empty - fill this in |
| `training_evidence` | **PLACEHOLDER** - For evidence notes | Empty - fill this in |
| `notes` | **PLACEHOLDER** - For additional notes | Empty - fill this in |

## Import CSV Functionality

### How to Import
1. Fill in the CSV with training dates and evidence
2. Click the **"Import CSV"** button (with user-plus icon)
3. Select your modified CSV file
4. The system will process updates and show a success/error summary

### Required Fields for Import
- `assignment_id` - Must match existing assignment
- `user_auth_id` - For verification
- `training_date` - Use YYYY-MM-DD format (e.g., `2024-10-14`)
- `training_evidence` - Text describing the evidence

### CSV Import Rules
1. **Date Format**: Training dates must be in `YYYY-MM-DD` format
2. **Required Headers**: `assignment_id`, `user_auth_id`, `training_date`, `training_evidence`
3. **Batch Processing**: Updates are processed in batches of 50
4. **Error Reporting**: Invalid dates or missing data will be reported

### Example Workflow
1. Export CSV to get current assignments
2. Open in Excel/Google Sheets
3. Fill in `training_date` column with completion dates
4. Fill in `training_evidence` column with evidence descriptions
5. Fill in `notes` column with additional information
6. Save as CSV
7. Import back into the system

### Sample CSV Data
```csv
assignment_id,user_auth_id,user_name,user_email,item_type,item_id,item_name,assigned_at,completed_at,training_date,training_evidence,notes
12345,auth123,John Doe,john@company.com,module,mod_001,Safety Training,2024-10-01,,2024-10-14,Completed online quiz with 95% score,Excellent understanding demonstrated
12346,auth124,Jane Smith,jane@company.com,document,doc_001,Policy Manual,2024-10-02,,2024-10-15,Signed acknowledgment form received,Asked clarifying questions
```

## Error Handling
- Invalid date formats will be reported with row numbers
- Missing required fields will prevent import
- Database errors for individual updates are tracked and reported
- Success/failure counts are displayed after import

## Notes
- The import process updates the `completed_at` field when `training_date` is provided
- Additional fields like `training_evidence` and `notes` are stored if the database supports them
- The CSV maintains all original assignment data for reference
- All operations include proper error handling and user feedback

## Troubleshooting
- Ensure CSV is properly formatted with commas as separators
- Check that date formats match YYYY-MM-DD exactly
- Verify that assignment IDs exist in the database
- Large files are processed in batches to avoid timeouts
