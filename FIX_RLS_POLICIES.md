# Fix RLS Policy Errors - Complete Solution

## Problem

Getting **403 errors** with message:
```
"new row violates row-level security policy for table \"user_assignments\""
```

or

```
"new row violates row-level security policy for table \"role_assignments\""
```

## Root Cause

The RLS (Row Level Security) policies on these tables are blocking INSERT operations, even when using the service role key from API routes.

**Why this happens:**
1. RLS is enabled on the tables
2. Policies exist that check `auth.uid()` for admin permissions
3. When API routes use service role key, there's no authenticated user session
4. The INSERT policies fail because they can't verify admin access

## Solution

Run the comprehensive RLS fix script that properly configures both tables.

### Option 1: Via Supabase Dashboard (Easiest)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `scripts/fix-all-rls-policies.sql`
4. Click **Run**

### Option 2: Via psql

```bash
psql "$DATABASE_URL" -f scripts/fix-all-rls-policies.sql
```

### Option 3: Via Supabase CLI

```bash
npx supabase db execute --file scripts/fix-all-rls-policies.sql
```

## What This Fix Does

The script will:

### For `user_assignments` table:
1. ✅ Drop all existing policies
2. ✅ Create new policies that allow:
   - **Users**: View and update their own assignments
   - **Admins/Managers/Trainers**: View, insert, update all assignments
   - **Admins**: Delete assignments
3. ✅ Service role key automatically bypasses all RLS

### For `role_assignments` table:
1. ✅ Drop all existing policies
2. ✅ Create new policies that allow:
   - **All authenticated users**: View role assignments
   - **Admins**: Insert, update, delete role assignments
3. ✅ Service role key automatically bypasses all RLS

## Important Note About Service Role Keys

**Service role keys bypass RLS by default in Supabase**, but the policies still need to exist for regular authenticated users. The error you're seeing suggests one of these scenarios:

1. The API route is not properly using the service role key
2. The Supabase client is using the anon key instead
3. There's a missing policy that's required before service role bypass can work

The fix script ensures all necessary policies are in place.

## Verification

After running the script, you should see output like:

### user_assignments policies:
```
 policyname                                    | cmd
-----------------------------------------------+--------
 Admins and managers can delete assignments    | DELETE
 Admins and managers can insert assignments    | INSERT
 Admins and managers can update all assignments| UPDATE
 Admins and managers can view all assignments  | SELECT
 Users can update their own assignments        | UPDATE
 Users can view their own assignments          | SELECT
```

### role_assignments policies:
```
 policyname                           | cmd
--------------------------------------+--------
 Admins can delete role assignments   | DELETE
 Admins can insert role assignments   | INSERT
 Admins can update role assignments   | UPDATE
 Anyone can view role assignments     | SELECT
```

## Testing

After applying the fix:

### Test 1: Role Assignment
1. Log in as an **Admin** user
2. Go to **Admin** → **Roles** → **Modules**
3. Try to assign modules/documents to a role
4. ✅ Should work without 403 error

### Test 2: User Role Change
1. Log in as an **Admin** user
2. Go to **HR** → **People**
3. Change a user's role
4. ✅ Should sync assignments without 403 error

### Test 3: Sync Training API
1. Make a POST request to `/api/sync-training-from-profile`
2. With body: `{ "role_id": "some-role-id" }`
3. ✅ Should insert assignments without 403 error

## If You Still Get 403 Errors

Check these items:

### 1. Verify Service Role Key
Make sure your API routes are using the service role key:

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← Must be service role, not anon key
);
```

### 2. Check Environment Variables
```bash
# In .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Service role key (starts with eyJhbGci)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... # Anon key (different from service role)
```

### 3. Verify RLS is Properly Configured
Run this in SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user_assignments', 'role_assignments');

-- Should show rowsecurity = true for both

-- Check policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('user_assignments', 'role_assignments')
ORDER BY tablename, policyname;

-- Should show all 6 policies for user_assignments and 4 for role_assignments
```

### 4. Restart Your Dev Server
After applying RLS changes:
```bash
# Stop the dev server
# Then restart it
npm run dev
```

## Related Files

- `scripts/fix-all-rls-policies.sql` - The comprehensive fix
- `scripts/fix-user-assignments-rls.sql` - user_assignments only
- `scripts/fix-role-assignments-rls.sql` - role_assignments only

## Need Help?

If you continue to get 403 errors after applying this fix:

1. Check the browser console for the exact error message
2. Check your server logs for the API route that's failing
3. Verify which table is mentioned in the error (user_assignments or role_assignments)
4. Check if you're logged in as an admin user with proper access_level

The most common issue is using the **anon key** instead of the **service role key** in API routes.
