# User View Permissions - Setup Guide

## Overview
The "Trainer" column has been repurposed to show a view permissions icon for **Managers, Department Managers, and Trainers**. Clicking this icon opens a dialog where you can grant additional access to view other departments and shifts beyond their default assignments.

## The Problem This Solves

By default, Managers should only see:
- Their own department
- Their own shift

However, some managers need broader visibility. This feature allows HR Admins to grant additional access on a per-user basis.

## What Changed

### 1. Database Table
**File**: `supabase/migrations/20251216_create_trainer_permissions.sql`

A new `user_view_permissions` table stores extended viewing permissions:
- `id` - UUID primary key
- `user_id` - References the user
- `department_id` - Additional department they can view (optional)
- `shift_id` - Additional shift they can view (optional)
- `created_at` / `updated_at` - Timestamps

### 2. Updated Component
**File**: `src/components/user/UserViewPermissionsDialog.tsx`

This dialog allows HR Admins to:
- See the user's default department and shift
- Select **additional** departments the user can view
- Select **additional** shifts the user can view
- Save the extended permissions

### 3. Updated UserManagementPanel
**File**: `src/components/user/UserManagementPanel.tsx`

The "Trainer" column now shows a green 👥 icon for:
- Users with `access_level = "Manager"`
- Users with `access_level = "Dept. Manager"`
- Users with `access_level = "Trainer"`
- Users with `is_trainer = true`

Clicking the icon opens the permissions dialog.

## ⚠️ CRITICAL: Self-Access to Training

**Before we discuss view permissions, understand this fundamental rule:**

### ALL Users Can ALWAYS View Their Own Training

Regardless of access level or view permissions:
- ✅ Users can ALWAYS see their own training assignments
- ✅ Users can ALWAYS see their own training history
- ✅ Users can ALWAYS complete their own training
- ✅ This NEVER requires view permissions

**View permissions only control what OTHER users' data they can see.**

### Example:
- John is a Manager in "Warehouse" on "Morning Shift"
- John can **ALWAYS** see his own First Aid training, Safety training, etc.
- View permissions control whether John can see **Sarah's** training, **Mike's** training, etc.
- By default: John can only see training for other users in Warehouse + Morning Shift
- With extended permissions: John can see training for other users in additional departments/shifts

---

## How It Works

### Default Access (without permissions)
A Manager with:
- `department_id = "Sales"`
- `shift_id = "Morning"`

Can only view:
- Users in the Sales department
- Users on the Morning shift

### Extended Access (with permissions)
If you grant additional access via the dialog:
- Select "Marketing" department → They can now view Sales AND Marketing
- Select "Evening" shift → They can now view Morning AND Evening shifts

### In Your Application Code

When querying data that should be filtered by permissions, you'll need to:

1. **Check if the user has extended permissions:**

```typescript
async function getUserViewPermissions(userId: string) {
  const { data } = await supabase
    .from('user_view_permissions')
    .select('department_id, shift_id')
    .eq('user_id', userId);

  return data || [];
}
```

2. **Build a query that includes both default and extended access:**

```typescript
async function getVisibleUsers(currentUser: User) {
  // Get extended permissions
  const permissions = await getUserViewPermissions(currentUser.id);

  // Build department filter: own department + extended departments
  const visibleDepartments = [
    currentUser.department_id,
    ...permissions.filter(p => p.department_id).map(p => p.department_id)
  ].filter(Boolean);

  // Build shift filter: own shift + extended shifts
  const visibleShifts = [
    currentUser.shift_id,
    ...permissions.filter(p => p.shift_id).map(p => p.shift_id)
  ].filter(Boolean);

  // Query with filters
  const { data } = await supabase
    .from('users')
    .select('*')
    .or(
      `department_id.in.(${visibleDepartments.join(',')}),` +
      `shift_id.in.(${visibleShifts.join(',')})`
    );

  return data;
}
```

## Setup Instructions

### Step 1: Apply the Database Migration

**Option A: Using Supabase Dashboard (RECOMMENDED)**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the SQL from `supabase/migrations/20251216_create_trainer_permissions.sql`
5. Paste and click **Run**

**The SQL creates:**
- `user_view_permissions` table
- Indexes for performance
- RLS policies for security
- Auto-update timestamp trigger

### Step 2: Test the Feature

1. Start your dev server: `npm run dev`
2. Navigate to HR Admin → People tab
3. Look for users with Manager, Dept. Manager, or Trainer access levels
4. You should see a green 👥 icon in the "Trainer" column
5. Click the icon to open the permissions dialog
6. Select additional departments/shifts
7. Save

### Step 3: Update Your Application Logic

You'll need to update various parts of your app to respect these permissions:

**Places that likely need updates:**
- User lists (filter by visible departments/shifts)
- Training views (show only users the manager can see)
- Reports and analytics (scope to accessible departments)
- Dashboard widgets (filter data by permissions)

## Example: Filtering a User List

```typescript
// In a page or component that shows users
import { useUser } from '@/lib/useUser';

export default function UserListPage() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      // For admins, show all users
      if (['Super Admin', 'HR Admin', 'Admin'].includes(currentUser.access_level)) {
        const { data } = await supabase.from('users').select('*');
        setUsers(data || []);
        return;
      }

      // For managers, show only users they have permission to view
      const permissions = await supabase
        .from('user_view_permissions')
        .select('department_id, shift_id')
        .eq('user_id', currentUser.id);

      const extraDepts = permissions.data
        ?.filter(p => p.department_id)
        .map(p => p.department_id) || [];

      const extraShifts = permissions.data
        ?.filter(p => p.shift_id)
        .map(p => p.shift_id) || [];

      const depts = [currentUser.department_id, ...extraDepts].filter(Boolean);
      const shifts = [currentUser.shift_id, ...extraShifts].filter(Boolean);

      // Query with OR condition
      let query = supabase.from('users').select('*');

      if (depts.length > 0 && shifts.length > 0) {
        query = query.or(
          `department_id.in.(${depts.join(',')}),` +
          `shift_id.in.(${shifts.join(',')})`
        );
      } else if (depts.length > 0) {
        query = query.in('department_id', depts);
      } else if (shifts.length > 0) {
        query = query.in('shift_id', shifts);
      }

      const { data } = await query;
      setUsers(data || []);
    }

    loadUsers();
  }, [currentUser]);

  return <div>{/* render users */}</div>;
}
```

## Helper Function (Recommended)

Create a reusable helper in `/lib/permissions.ts`:

```typescript
import { supabase } from '@/lib/supabase-client';

export async function getViewableUserQuery(currentUserId: string, currentUserAccessLevel: string, currentUserDepartmentId?: string, currentUserShiftId?: string) {
  // Admins see everything
  if (['Super Admin', 'HR Admin', 'Admin', 'H&S Admin'].includes(currentUserAccessLevel)) {
    return supabase.from('users').select('*');
  }

  // Get extended permissions for this user
  const { data: permissions } = await supabase
    .from('user_view_permissions')
    .select('department_id, shift_id')
    .eq('user_id', currentUserId);

  // Collect all departments and shifts they can view
  const departments = [
    currentUserDepartmentId,
    ...(permissions?.filter(p => p.department_id).map(p => p.department_id) || [])
  ].filter(Boolean);

  const shifts = [
    currentUserShiftId,
    ...(permissions?.filter(p => p.shift_id).map(p => p.shift_id) || [])
  ].filter(Boolean);

  // Build query
  let query = supabase.from('users').select('*');

  if (departments.length > 0 && shifts.length > 0) {
    query = query.or(
      `department_id.in.(${departments.join(',')}),` +
      `shift_id.in.(${shifts.join(',')})`
    );
  } else if (departments.length > 0) {
    query = query.in('department_id', departments);
  } else if (shifts.length > 0) {
    query = query.in('shift_id', shifts);
  }

  return query;
}
```

Then use it throughout your app:

```typescript
import { getViewableUserQuery } from '@/lib/permissions';

const query = await getViewableUserQuery(
  user.id,
  user.access_level,
  user.department_id,
  user.shift_id
);

const { data: visibleUsers } = await query;
```

## Security Notes

- The `user_view_permissions` table has RLS enabled
- Only HR Admins and Super Admins can modify permissions
- All authenticated users can read permissions (needed for filtering)
- Extended permissions are additive (they grant MORE access, never less)
- Default access (own department/shift) is always included

## Column Name Confusion

The column is still labeled "Trainer" in the UI for now. You may want to rename it to "View Permissions" or add a separate column. To rename:

```typescript
// In UserManagementPanel.tsx, line ~756
{ header: "Trainer", accessor: "is_trainer", width: 80 }
// Change to:
{ header: "Permissions", accessor: "is_trainer", width: 80 }
```

## Files Modified

- ✅ `supabase/migrations/20251216_create_trainer_permissions.sql` - Database migration
- ✅ `src/components/user/UserViewPermissionsDialog.tsx` - Permissions dialog
- ✅ `src/components/user/UserManagementPanel.tsx` - Shows icon for managers/trainers
- ✅ `USER_VIEW_PERMISSIONS_SETUP.md` - This documentation

## Next Steps

1. ✅ Apply the SQL migration
2. ✅ Test the feature in HR Admin view
3. 🔲 Update application queries to use permissions
4. 🔲 Create the helper function in `/lib/permissions.ts`
5. 🔲 Update all user-facing views to filter by permissions
6. 🔲 Test with different manager accounts
7. 🔲 Consider renaming the "Trainer" column header

## Questions?

If you encounter issues or need help implementing the permission filtering in specific pages, let me know!
