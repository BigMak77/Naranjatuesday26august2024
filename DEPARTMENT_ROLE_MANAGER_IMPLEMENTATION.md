# Department/Role Manager Implementation

## Overview
Created a dedicated section for department/role management that properly updates both the `users` table and the `user_role_history` table with full audit trail capabilities.

## Implementation Details

### 1. New Component: DepartmentRoleManager
**File:** `src/components/user/DepartmentRoleManager.tsx`

**Features:**
- Dedicated dialog for changing user department and role
- Displays current vs. new values with visual comparison
- Requires a reason for every change (audit requirement)
- Automatic training assignment synchronization when role changes
- Full history tracking in the `user_role_history` table

**Workflow:**
1. User opens the manager for a specific employee
2. Selects new department and role
3. Provides a reason for the change
4. System shows a summary of changes before applying
5. On save:
   - Updates `users` table with new department/role
   - Inserts a record into `user_role_history` table with:
     - Old department and role IDs
     - New department and role IDs
     - Who made the change (`changed_by`)
     - Reason for the change
     - Timestamp
   - Syncs training assignments via API endpoint
   - Removes old role assignments
   - Adds new role assignments

### 2. Integration with UserManagementPanel
**File:** `src/components/user/UserManagementPanel.tsx`

**Changes:**
- **Department and Role fields are now READ-ONLY** when editing existing users
- Added new button "Change Dept/Role" in the user edit dialog
- Button is only visible when editing existing users (not in add mode)
- Opens the DepartmentRoleManager component in a separate dialog
- Refreshes the user table after successful changes
- Shows success notification after completion
- **Important:** The `handleSave` function explicitly excludes `department_id` and `role_id` from updates for existing users

**Field Behavior:**
- **Add Mode (New Users):** Department and role are editable dropdowns - users can select initial values
- **Edit Mode (Existing Users):** Department and role are disabled/read-only with a message directing users to use the "Change Dept/Role" button

**Button Location:**
In the actions section of the user edit dialog, between the "Register as Leaver" button and "Manage Permissions" button.

**Code Protection:**
The save function is protected to prevent accidental inline updates:
```typescript
// When editing existing users, exclude department_id and role_id
// These must be changed through the DepartmentRoleManager for proper history tracking
const { error: userErr } = await supabase
  .from("users")
  .update({
    // ... other fields ...
    // department_id and role_id are NOT updated here
  })
```

### 3. Database Tables Used

#### users table
Updated fields:
- `department_id`
- `role_id`

#### user_role_history table
Schema:
```sql
CREATE TABLE user_role_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  old_role_id UUID REFERENCES roles(id),
  old_department_id UUID REFERENCES departments(id),
  new_role_id UUID REFERENCES roles(id),
  new_department_id UUID REFERENCES departments(id),
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
```

### 4. API Integration

**Endpoint:** `/api/update-user-role-assignments`

**Purpose:** Synchronizes training assignments when a user's role changes

**Process:**
1. Removes assignments from the old role
2. Adds assignments from the new role
3. Logs the change for audit purposes

## User Experience

### Opening the Manager
1. Navigate to HR Admin → People tab
2. Click on a user's name or the edit button
3. In the user edit dialog, click the "Change Dept/Role" button (with users icon)
4. The dedicated Department/Role Manager dialog opens

### Making a Change
1. **User Information Panel** - Shows current user details
2. **Department Selection** - Choose the new department
3. **Role Selection** - Choose the new role (filtered by department)
4. **Change Reason** - Required text field for audit trail
5. **Change Summary** - Visual display showing old → new values
6. **Training Notice** - Info box explains that training assignments will be updated

### Validation
- Department is required
- Role is required
- Change reason is required
- At least one field must be different from current values

## Benefits

1. **Full Audit Trail** - Every department/role change is recorded with who, when, why
2. **Automatic Training Sync** - Training assignments automatically update based on new role
3. **Clean Separation** - Role changes are separated from other user edits
4. **Historical Tracking** - Can view history of all role changes via UserRoleHistory component
5. **User-Friendly** - Clear visual feedback and change summary before applying
6. **Data Integrity** - Transactional updates ensure consistency across tables
7. **Enforced Workflow** - Department/role fields are read-only in edit mode, forcing users to use the proper workflow
8. **No Accidental Changes** - Code-level protection prevents department/role updates outside the dedicated manager
9. **Consistent History** - All role changes go through the same path, ensuring complete history tracking

## Related Components

- **UserRoleHistory** (`src/components/roles/UserRoleHistory.tsx`) - Displays historical role changes
- **UserManagementPanel** (`src/components/user/UserManagementPanel.tsx`) - Main user management interface
- **API Route** (`src/app/api/update-user-role-assignments/route.ts`) - Handles assignment synchronization

## Testing

To test the implementation:

1. Navigate to HR Admin view
2. Go to the People tab
3. Click on a user
4. Click "Change Dept/Role" button
5. Select a new department and role
6. Enter a reason (e.g., "Promotion to Team Lead")
7. Review the change summary
8. Click Save
9. Verify the user's role updated in the table
10. Check the Role History tab to see the change recorded

## Future Enhancements

Potential improvements:
- Email notification to user when their role changes
- Approval workflow for role changes
- Bulk role changes with history tracking
- Export role change history to CSV
- Department change impact analysis (show affected team members)
