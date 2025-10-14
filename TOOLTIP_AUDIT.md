## BUTTON TOOLTIP AUDIT - Components Needing Custom Tooltips

### COMPLETED ✅
- `/src/components/structure/RoleStructure.tsx` - Custom tooltip added
  - Globe button: "Amend department structure" 
  - Tool/wrench button: "Move role to new department"
  - Add department button: "Add department"
  - Add role button: "Add role"
- `/src/app/reports/page.tsx` - Custom tooltip added
  - Calendar button: "Open main rota"
  - Grid button: "View training matrix"  
  - Layers button: "View department rotas"
  - Alert button: "Departments without manager"
  - Purple layers button: "View group module report"
- `/src/components/modal.tsx` - Custom tooltip added (already had)
  - Close button: "Close modal"
- `/src/components/modules/ArchiveModuleTab.tsx` - Custom tooltip added
  - Archive button: "Archive this module" (already had)
  - Cancel button: "Cancel" (added)
- `/src/components/AssignmentSyncButtons.tsx` - Custom tooltip added
  - Scan button: "Scan for legacy assignment issues"
  - Fix user button: "Fix this user's role assignments"
  - Bulk fix button: "Fix all users' role assignments (use carefully)"
- `/src/app/admin/dashboard/page.tsx` - Custom tooltip added  
  - All feature card action buttons: Dynamic tooltips based on ariaLabel/label
- `/src/components/user/UserManagementPanel.tsx` - **COMPLETED** - Added CustomTooltip to all buttons:
  - Add User button: "Add new user to the system"
  - Download CSV button: "Export all users data to CSV file" 
  - Show/Hide Leavers button: Dynamic text based on state
  - Bulk Assign button: "Assign roles, shifts, or permissions to multiple users at once"
  - Pagination buttons: "Go to previous/next page"
  - Edit User buttons: "Edit this user's details"
  - Next buttons (bulk assignment): "Proceed to configure bulk assignments for selected users"
  - Register as Leaver button: "Mark this user as having left the company"
  - Manage Permissions button: "Manage user's system permissions and access levels"
  - Save buttons: Dynamic text based on loading state
  - Cancel button: "Cancel changes and close dialog"
  - Bulk Confirm button: Dynamic text based on loading state
- `/src/components/audit/QuestionTab.tsx` - **COMPLETED** - Added CustomTooltip to button:
  - Add Question button: "Add a new audit question"
- `/src/components/audit/QuestionEditor.tsx` - **COMPLETED** - Added CustomTooltip to all buttons:
  - Bulk toggle button: Dynamic text based on state
  - Bulk add button: "Add all questions from the text area"
  - Remove buttons: "Remove this question from the audit"
  - Add Question button: "Add a single new question"
- `/src/components/audit/StandardsTab.tsx` - **COMPLETED** - Added CustomTooltip to all buttons:
  - Edit section buttons: "Edit this section's description"
  - Manage questions buttons: "Manage audit questions for this section"
  - Save description button: Dynamic text based on loading state
  - Cancel button: "Cancel editing and close dialog"
  - Add question field button: "Add another question input field"
  - Add Questions button: "Add all questions to this section"
  - Save Changes button: "Save changes to existing questions"
  - Close button: "Close questions management dialog"
- `/src/components/audit/AssignAuditTab.tsx` - **COMPLETED** - Added CustomTooltip to button:
  - Cancel button: "Cancel user selection and close dialog"
- `/src/components/audit/ViewAuditTab.tsx` - **COMPLETED** - Added CustomTooltip to buttons:
  - View Details buttons: Dynamic text based on expand state
  - Archive buttons: "Archive this audit template"
- `/src/components/modules/TrainingModuleManager.tsx` - **COMPLETED** - Added CustomTooltip to all buttons:
  - Edit Module buttons: "Edit this training module"
  - Archive Module buttons: "Archive this training module"
  - Confirm Archive button: Dynamic text based on loading state
  - Cancel button: "Cancel archiving"
- `/src/components/training/AddQuestionPackForm.tsx` - **COMPLETED** - Added CustomTooltip to all buttons:
  - Remove question buttons: "Remove this question field"
  - Add Question button: "Add another question input field"
  - Submit button: Dynamic text based on state and context
  - "Yes, add from another category" button: "Add questions from another category to this pack"
  - "No, finish" button: "Finish creating this question pack"
  - Close button: "Close success message"

### PENDING ⏳

#### HIGH PRIORITY - Structure Components
1. `/src/components/structure/ManagerStructure.tsx` - **CHALLENGING** - Large file with complex structure, prone to corruption
   - `neon-btn-globe` buttons: Department structure management
   - `neon-btn-tool` buttons: Role movement/assignment
   - `neon-btn-add` buttons: Adding departments/roles
   - **Note**: This file needs careful manual editing due to its complexity

#### MEDIUM PRIORITY - Reports & Admin
2. `/src/app/reports/page.tsx` - Report action buttons
3. `/src/components/modules/ArchiveModuleTab.tsx` - Archive/delete buttons
4. `/src/components/admin/*` - Various admin panel buttons

#### LOW PRIORITY - Forms & Modals
5. `/src/components/modal.tsx` - Modal close buttons
6. `/src/components/modules/TrainingModuleManager.tsx` - Module management
7. `/src/components/issues/*` - Issue management buttons

### TOOLTIP DESCRIPTIONS NEEDED:
- Globe buttons: "Amend department structure" / "Configure settings"
- Tool/wrench buttons: "Move to department" / "Transfer role" 
- Add buttons: "Add new [item]" / "Create [item]"
- Delete buttons: "Delete [item]" / "Remove [item]"
- Archive buttons: "Archive [item]" / "Hide [item]"
- View buttons: "View details" / "Open [item]"
- Edit buttons: "Edit [item]" / "Modify [item]"
- Save buttons: "Save changes" / "Confirm"
- Cancel buttons: "Cancel" / "Discard changes"
