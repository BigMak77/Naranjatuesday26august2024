# User Role History Implementation

## Overview

This implementation adds a complete role history tracking system to the HR Admin View. It logs all role and department changes for users and displays their historical assignments from each role period.

## Features

### 1. Database Schema
- **New Table**: `user_role_history`
  - Tracks role and department changes for all users
  - Stores old and new values for both role_id and department_id
  - Includes metadata: changed_by, change_reason, timestamps
  - Full foreign key relationships to users, roles, and departments tables
  - Optimized indexes for common query patterns

### 2. Automatic Logging
- **Database Trigger**: Automatically logs changes when users' roles or departments are updated
- No manual code required - completely automated
- Logs only when actual changes occur (not on every update)

### 3. Security
- **Row Level Security (RLS)** enabled with policies:
  - Admins and Super Admins can view all history
  - Managers can view history for users in their department
  - Users can view their own role history
  - Only Admins can insert new history entries

### 4. User Interface
- **New Tab**: "Role History" in HR Admin View
- **Filtering**: By user, date range
- **Expandable Rows**: Click to view historical assignments for each role period
- **Assignment Details**: Shows all modules and documents completed during each role
- **Rich Information**: User details, role changes, department changes, who made the change, and why

## Files Created

### Database Files
1. **[scripts/create-user-role-history-table.sql](scripts/create-user-role-history-table.sql)**
   - Creates the user_role_history table
   - Adds indexes for performance
   - Sets up RLS policies

2. **[scripts/create-role-change-trigger.sql](scripts/create-role-change-trigger.sql)**
   - Creates trigger function to log changes
   - Attaches trigger to users table
   - Automatically logs role/department changes

3. **[scripts/run-user-role-history-migration.js](scripts/run-user-role-history-migration.js)**
   - Node.js script to execute the migration
   - Runs both SQL files in order
   - Provides helpful output and error handling

### Frontend Files
1. **[src/components/userview/UserRoleHistory.tsx](src/components/userview/UserRoleHistory.tsx)**
   - Complete React component for viewing role history
   - Fetches and displays role history with all related data
   - Expandable rows to show historical assignments
   - Filter controls for user and date range
   - Real-time loading states and error handling

2. **[src/components/userview/HrAdminView.tsx](src/components/userview/HrAdminView.tsx)** (modified)
   - Added "Role History" tab
   - Imported and rendered UserRoleHistory component
   - Added toolbar section for the new tab

## Installation

### Step 1: Run the Database Migration

```bash
node scripts/run-user-role-history-migration.js
```

This will:
- Create the `user_role_history` table
- Add all necessary indexes
- Set up Row Level Security policies
- Create the automatic trigger for logging changes

### Step 2: Verify Installation

Check that the table was created successfully:

```sql
SELECT * FROM user_role_history;
```

Initially, this should be empty. The table will populate automatically as users' roles change.

## Usage

### Accessing the Role History Tab

1. Navigate to the HR Admin View
2. Click on the "Role History" tab
3. View all historical role changes

### Filtering History

- **By User**: Select a user from the dropdown to see only their history
- **By Date Range**: Set start and end dates to filter by change date
- **Clear Filters**: Click the refresh button to reset all filters

### Viewing Historical Assignments

1. Click the expand button (▼) next to any history entry
2. View all modules and documents assigned during that role period
3. See completion status, assigned dates, and completed dates
4. Click again (▲) to collapse

### Understanding the Data

Each history entry shows:
- **User**: Name and email of the user whose role changed
- **Previous Role**: The role they had before
- **New Role**: The role they changed to
- **Previous Department**: The department they were in before
- **New Department**: The department they moved to
- **Changed By**: Who made the change (admin name or "System")
- **Changed At**: When the change occurred
- **Reason**: Optional reason for the change (if provided)

When expanded, you can also see:
- All training modules assigned to that role
- All documents assigned to that role
- Completion status for each item
- Assignment and completion timestamps

## Database Schema Details

### user_role_history Table

```sql
CREATE TABLE user_role_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  old_role_id UUID REFERENCES roles(id),
  old_department_id UUID REFERENCES departments(id),
  new_role_id UUID REFERENCES roles(id),
  new_department_id UUID REFERENCES departments(id),
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

### Relationships

- Links to `users` table for the user whose role changed
- Links to `roles` table for both old and new roles
- Links to `departments` table for both old and new departments
- Links to `users` table for who made the change
- Connects to `user_assignments` via user's auth_id and item_ids

## How Historical Assignments Work

The component fetches historical assignments by:

1. Getting the user's `auth_id` from the users table
2. Finding all modules and documents assigned to the old role via `role_assignments`
3. Querying `user_assignments` for assignments matching:
   - The user's `auth_id`
   - The item IDs from the role assignments
4. Displaying completion status, dates, and details for each assignment

This allows you to see exactly what training and documents the user completed during each role period.

## Future Enhancements

Potential improvements for future versions:

1. **Manual History Entry**: Allow admins to manually add historical entries
2. **Export Functionality**: Export role history to CSV
3. **Assignment Date Filtering**: Show only assignments from the specific role period
4. **Comparison View**: Compare assignments between different roles
5. **Audit Trail**: Track who viewed the role history
6. **Notifications**: Alert managers when team members change roles
7. **Analytics Dashboard**: Visualize role change patterns over time

## Troubleshooting

### Table Not Created
If the migration fails:
- Check that `DATABASE_URL` is set in `.env.local`
- Verify database connection
- Check for existing table conflicts
- Review error messages in console

### No History Showing
If history entries aren't appearing:
- Verify the trigger is installed: `SELECT * FROM pg_trigger WHERE tgname = 'user_role_change_trigger';`
- Make a test role change to verify trigger works
- Check RLS policies match your user's access level

### Assignments Not Loading
If historical assignments aren't showing:
- Verify `user_assignments` table exists and has data
- Check that role_assignments are properly configured
- Ensure the user has an `auth_id` in the users table

## Technical Notes

- **Performance**: Indexes are optimized for filtering by user_id and changed_at
- **Data Integrity**: Foreign keys ensure referential integrity
- **Security**: RLS policies prevent unauthorized access
- **Scalability**: Designed to handle thousands of history entries efficiently
- **Automatic**: No manual intervention required once installed

## Support

For issues or questions:
1. Check the browser console for errors
2. Review the database logs
3. Verify RLS policies match your access level
4. Check that all related tables (users, roles, departments, user_assignments) exist and have data
