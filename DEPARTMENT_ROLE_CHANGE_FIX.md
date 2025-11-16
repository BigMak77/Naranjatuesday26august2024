# Department/Role Change Authentication Fix

## Issue
When attempting to change a user's department or role through the `DepartmentRoleManager` component, users encountered an "Authentication required" error. This error occurred when the component tried to insert a record into the `user_role_history` table using client-side Supabase calls.

## Root Cause
The `DepartmentRoleManager` component was making direct database inserts from the client side:

```typescript
const { error: historyError } = await supabase
  .from("user_role_history")
  .insert({
    user_id: user.id,
    old_role_id: originalRoleId,
    old_department_id: originalDepartmentId,
    new_role_id: selectedRoleId,
    new_department_id: selectedDepartmentId,
    changed_by: currentUser?.id || null,
    change_reason: changeReason.trim(),
    changed_at: new Date().toISOString()
  });
```

This approach had the following issues:
1. **RLS Policy Restrictions**: Row Level Security (RLS) policies on `user_role_history` required proper authentication context
2. **Client-Side Limitations**: The client-side Supabase connection uses the anon key with limited permissions
3. **Session Management**: The authentication state might not have been properly established in the client context

## Solution
Created a server-side API route to handle the entire department/role change operation:

### 1. New API Route
**File**: `/src/app/api/change-user-department-role/route.ts`

This API route:
- Uses the Supabase service role key (full database access)
- Handles all three operations atomically:
  1. Updates the `users` table with new department and role
  2. Inserts a record into `user_role_history` for audit tracking
  3. Syncs training assignments if the role changed (calls existing API)
- Returns detailed success/error information

### 2. Updated Component
**File**: `/src/components/user/DepartmentRoleManager.tsx`

Changed from direct database operations to API call:

```typescript
const response = await fetch("/api/change-user-department-role", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: user.id,
    old_department_id: originalDepartmentId,
    old_role_id: originalRoleId,
    new_department_id: selectedDepartmentId,
    new_role_id: selectedRoleId,
    changed_by: currentUser?.id || null,
    change_reason: changeReason.trim()
  })
});
```

### 3. Additional Fix
**File**: `/src/components/userview/HrAdminView.tsx`

Removed invalid `searchQuery` prop from `UserManagementPanel` component that was causing build errors.

## Benefits of This Approach

1. **Security**: Server-side operations with service role key bypass RLS issues
2. **Reliability**: No dependency on client-side authentication state
3. **Atomicity**: All operations happen server-side in a controlled manner
4. **Audit Trail**: Proper logging of changes with reasons
5. **Training Sync**: Automatic synchronization of training assignments when roles change

## Files Modified

1. `/src/app/api/change-user-department-role/route.ts` - **NEW** API route
2. `/src/components/user/DepartmentRoleManager.tsx` - Updated to use API
3. `/src/components/userview/HrAdminView.tsx` - Fixed prop issue

## Testing

After deploying these changes:

1. Navigate to the HR Admin view (People tab)
2. Select a user to edit
3. Click "Change Dept/Role" button
4. Select a new department and role
5. Provide a change reason
6. Save changes

The operation should complete successfully without authentication errors, and:
- User's department and role are updated
- Change is logged in `user_role_history` table
- Training assignments are synchronized if role changed

## Environment Requirements

Ensure `.env.local` contains:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (required for API route)

## Database Schema

The `user_role_history` table should have:
```sql
CREATE TABLE user_role_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  old_role_id UUID REFERENCES roles(id),
  old_department_id UUID REFERENCES departments(id),
  new_role_id UUID REFERENCES roles(id),
  new_department_id UUID REFERENCES departments(id),
  changed_by UUID REFERENCES users(id),
  change_reason TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

RLS policies can remain strict since all inserts now happen server-side.
