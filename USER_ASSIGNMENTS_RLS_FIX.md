# User Assignments Not Returning - RLS Policy Fix

## Issue
Completed user assignments (and potentially all assignments) are not being returned when users view their training dashboard or task lists. The data exists in the database (72 completed assignments confirmed), but queries from the client side return no results.

## Root Cause
The `user_assignments` table has Row Level Security (RLS) enabled, but the policies were either missing or incorrectly configured. This prevented authenticated users from accessing their own assignment data.

## Diagnosis
Running the diagnostic script confirmed:
- **Total assignments**: 217
- **Completed**: 72
- **Opened**: 1
- **Assigned**: 144

The data exists, but RLS policies were blocking access when querying with the client-side Supabase connection (using anon key).

## Solution
Created comprehensive RLS policies for the `user_assignments` table that:

### Policy 1: Users Can View Their Own Assignments
```sql
CREATE POLICY "Users can view their own assignments"
  ON user_assignments FOR SELECT TO authenticated
  USING (auth.uid() = auth_id);
```
Allows users to see assignments where `auth_id` matches their authenticated user ID.

### Policy 2: Users Can Update Their Own Assignments
```sql
CREATE POLICY "Users can update their own assignments"
  ON user_assignments FOR UPDATE TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);
```
Allows users to mark their assignments as opened or completed.

### Policy 3: Admins/Managers Can View All Assignments
```sql
CREATE POLICY "Admins and managers can view all assignments"
  ON user_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin', 'Dept. Manager', 'Manager', 'Trainer')
    )
  );
```

### Policy 4: Admins/Managers Can Insert Assignments
Allows authorized users to create assignments for others.

### Policy 5: Admins/Managers Can Update All Assignments
Allows authorized users to modify any assignment.

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy the contents of `/scripts/fix-user-assignments-rls.sql`
6. Click **Run** to execute

### Option 2: Via Command Line (if psql is configured)
```bash
psql "$DATABASE_URL" -f "/Users/bigmak/Documents/Naranja 4.3 copy/scripts/fix-user-assignments-rls.sql"
```

## Files Created

1. **`/scripts/fix-user-assignments-rls.sql`** - SQL script with RLS policies
2. **`/scripts/run-fix-user-assignments-rls.js`** - Helper script to display instructions
3. **`/scripts/check-user-assignments.js`** - Diagnostic script (already run)

## Testing After Fix

Once the SQL is applied:

1. **User Dashboard Test**:
   - Log in as a regular user
   - Navigate to `/user/dashboard`
   - Verify you can see your assignments in the `UserTrainingDashboard` component
   - Check that completed assignments show with completion dates

2. **Manager/Admin Test**:
   - Log in as a manager or admin
   - Navigate to training matrices or team dashboards
   - Verify you can see assignments for all team members

3. **Mark Complete Test**:
   - As a user, try marking an assignment as complete
   - Verify the update succeeds and the UI reflects the change

## Why This Approach

**Security Benefits**:
- Users can only see their own assignments (privacy)
- Managers and admins have broader access (oversight)
- Prevents unauthorized access to other users' data

**Functionality**:
- Users can self-service their training (mark as opened/completed)
- Admins can assign and track training organization-wide
- Service role (API routes) bypasses RLS for system operations

## Components Affected

This fix enables proper data access for:
- [UserTrainingDashboard.tsx](src/components/training/UserTrainingDashboard.tsx) - Line 91-94
- [TrainingMatrix.tsx](src/components/training/TrainingMatrix.tsx) - Line 85
- [TrainingMatrixWithHistory.tsx](src/components/training/TrainingMatrixWithHistory.tsx) - Line 72
- [MyTeamComplianceMatrix.tsx](src/components/manager/MyTeamComplianceMatrix.tsx) - Line 63
- All components querying `user_assignments` table

## Database Schema Reference

The `user_assignments` table structure:
```sql
CREATE TABLE user_assignments (
  id UUID PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id),
  item_id UUID,
  item_type TEXT, -- 'module', 'document', 'behaviour'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_by UUID,
  due_at TIMESTAMPTZ,
  origin_type TEXT,
  origin_id UUID,
  is_archived BOOLEAN DEFAULT false,
  follow_up_due_date DATE,
  follow_up_completed_at TIMESTAMPTZ,
  follow_up_required BOOLEAN DEFAULT false
);
```

## Verification

After applying the fix, run the diagnostic again:
```bash
cd "/Users/bigmak/Documents/Naranja 4.3 copy"
node scripts/check-user-assignments.js
```

Then test client-side access by logging into the application and checking the user dashboard.
