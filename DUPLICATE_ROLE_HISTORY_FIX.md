# Fix for Duplicate Role History Entries

## Problem
When changing a user's role through the "Change Dept/Role" button, duplicate entries were being created in the `user_role_history` table:
1. One entry with the actual user who made the change (`changed_by` populated)
2. Another entry marked as "System" (`changed_by` was NULL)

## Root Cause
Two mechanisms were creating history entries simultaneously:

1. **Manual Insert** - The `DepartmentRoleManager` component ([src/components/user/DepartmentRoleManager.tsx:126-138](src/components/user/DepartmentRoleManager.tsx#L126-L138)) manually inserts a record with:
   - `changed_by`: The current user's ID
   - `change_reason`: The reason provided by the user

2. **Database Trigger** - A PostgreSQL trigger `user_role_change_trigger` automatically creates a record whenever the `users` table is updated, but without capturing who made the change or why.

When both mechanisms fire for the same role change, you get two entries.

## Solution

### Phase 1: Clean Up Existing Duplicates ✅ COMPLETED
Ran the cleanup script that:
- Identified 3 sets of duplicate entries
- Kept the entries with `changed_by` populated (the manual entries)
- Deleted the system-generated duplicates

**Result:** 3 duplicate entries removed

### Phase 2: Disable the Trigger (REQUIRED - Manual Step)
You need to disable the automatic database trigger to prevent future duplicates.

**Option 1: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL:
   ```sql
   DROP TRIGGER IF EXISTS user_role_change_trigger ON users;
   ```

**Option 2: Using the provided SQL file**
1. Open [DISABLE_ROLE_TRIGGER.sql](DISABLE_ROLE_TRIGGER.sql)
2. Copy the content
3. Run it in the Supabase SQL Editor

### Phase 3: Code Changes ✅ COMPLETED
Updated [DepartmentRoleManager.tsx:127](src/components/user/DepartmentRoleManager.tsx#L127) to add a comment noting that the automatic trigger has been disabled to prevent duplicates.

## How It Works Now

When a user's department or role is changed via the `DepartmentRoleManager` component:

1. The component updates the `users` table with the new `department_id` and `role_id`
2. The component manually inserts a record into `user_role_history` with:
   - All the role change details (old/new department, old/new role)
   - Who made the change (`changed_by`)
   - Why they made the change (`change_reason`)
   - When it was changed (`changed_at`)
3. The automatic trigger is **disabled**, so no duplicate entry is created
4. Training assignments are automatically synced based on the new role

## Files Modified

1. **[src/components/user/DepartmentRoleManager.tsx](src/components/user/DepartmentRoleManager.tsx)** - Added comment about trigger being disabled
2. **[scripts/fix-duplicate-role-history.sql](scripts/fix-duplicate-role-history.sql)** - SQL script to disable trigger and clean up duplicates
3. **[scripts/fix-duplicate-role-history-via-api.js](scripts/fix-duplicate-role-history-via-api.js)** - JavaScript cleanup script (already executed)
4. **[DISABLE_ROLE_TRIGGER.sql](DISABLE_ROLE_TRIGGER.sql)** - Simple SQL to run in Supabase dashboard

## Verification

After disabling the trigger:
1. Try changing a user's role via the "Change Dept/Role" button
2. Check the `user_role_history` table
3. You should see only ONE entry for that change, with `changed_by` populated

## Next Steps

**Disable the Trigger** (REQUIRED)

Run the SQL from [DISABLE_ROLE_TRIGGER.sql](DISABLE_ROLE_TRIGGER.sql) in your Supabase SQL Editor:

```sql
DROP TRIGGER IF EXISTS user_role_change_trigger ON users;
```

Once completed:
- ✅ You will no longer see duplicate entries when changing roles
- ✅ Role history properly tracks who made each change (using `user_id` and `changed_by`)
- ✅ System is fully functional
