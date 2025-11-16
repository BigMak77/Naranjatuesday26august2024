# Fix Role Assignments RLS Policy Error

## Problem
You're getting a **403 error** with message: `"new row violates row-level security policy for table \"user_assignments\""`

This is actually happening on the `role_assignments` table, not `user_assignments`. The RLS policies are preventing inserts.

## Solution

You need to update the RLS policies for the `role_assignments` table to allow admins to insert/update/delete role assignments.

### Option 1: Run via psql (Recommended)

```bash
psql "$DATABASE_URL" -f scripts/fix-role-assignments-rls.sql
```

### Option 2: Run via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/fix-role-assignments-rls.sql`
4. Click **Run**

### Option 3: Use the Supabase CLI

```bash
npx supabase db execute --file scripts/fix-role-assignments-rls.sql
```

## What This Does

The SQL script will:

1. ✅ Enable RLS on `role_assignments` table
2. ✅ Drop any existing policies
3. ✅ Create new policies that allow:
   - **SELECT**: All authenticated users can view role assignments
   - **INSERT**: Only Super Admin, Admin, and HR Admin can insert
   - **UPDATE**: Only Super Admin, Admin, and HR Admin can update
   - **DELETE**: Only Super Admin, Admin, and HR Admin can delete

## Verification

After running the script, you should see output like:

```
 schemaname | tablename         | policyname                        | permissive | roles         | cmd
------------+-------------------+-----------------------------------+------------+---------------+--------
 public     | role_assignments  | Admins can delete role assignments| PERMISSIVE | {authenticated}| DELETE
 public     | role_assignments  | Admins can insert role assignments| PERMISSIVE | {authenticated}| INSERT
 public     | role_assignments  | Admins can update role assignments| PERMISSIVE | {authenticated}| UPDATE
 public     | role_assignments  | Anyone can view role assignments  | PERMISSIVE | {authenticated}| SELECT
```

## Testing

After applying the fix:

1. Log in as an Admin user
2. Go to the Role Management page
3. Try to assign modules/documents to a role
4. The 403 error should be gone

## Why This Happened

The `role_assignments` table had RLS enabled but was missing proper INSERT policies for admin users. When the `RoleModuleDocumentAssignment` component tried to insert assignments, it was blocked by RLS.

This is separate from the `user_assignments` table fixes we just made to preserve completed training.
