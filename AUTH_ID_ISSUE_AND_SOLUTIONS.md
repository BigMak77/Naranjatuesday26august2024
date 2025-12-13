# auth_id Issue: Analysis & Solutions

**Date:** December 13, 2025
**Severity:** ⚠️ MEDIUM (affects 6 users, 1.2%)
**Status:** Ready for fix

---

## Executive Summary

**6 out of 516 users (1.2%)** are missing the `auth_id` field. This prevents them from:
- ❌ Logging in
- ❌ Getting automatic training assignments (triggers skip them)
- ❌ Being matched to their Supabase Auth accounts

The good news: This is a small, fixable issue with clear solutions.

---

## Affected Users

1. **Drew Screw** (dscrew@neo.com) - Created: Oct 15, 2025
2. **Max Swizek** (mswicek@sz.pl) - Created: Oct 15, 2025
3. **Fred White** (fred.white@example.com) - Created: Dec 7, 2025
4. **Flo Martin** (flo.martin@example.com) - Created: Dec 7, 2025
5. **Sandra Orchid** (sandra.orchid@exmaple.com) - Created: Dec 7, 2025
6. **Josef Snowc** (jsnow@here.com) - Created: Nov 28, 2025

**All 6 users** have role and department assignments, meaning they're missing their inherited training modules.

---

## Root Cause

### The Broken Flow

**Current user creation in [UserManagementPanel.tsx](src/components/user/UserManagementPanel.tsx:589-611):**

```typescript
// Line 590-611: Creates user WITHOUT auth_id
const { error: userErr, data: newUser } = await supabase
  .from("users")
  .insert({
    first_name: cleanedUser.first_name,
    last_name: cleanedUser.last_name,
    email: cleanedUser.email,
    department_id: cleanedUser.department_id,
    role_id: cleanedUser.role_id,
    access_level: cleanedUser.access_level,
    // ... other fields
    // ❌ NO auth_id field!
  })
```

**Separate auth creation in [create-auth-user API](src/app/api/create-auth-user/route.ts:77-88):**

```typescript
// Creates Supabase Auth user
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

// Returns the auth user (with user.id)
return NextResponse.json({ user: data.user }, { status: 200 });

// ❌ But doesn't update users table with auth_id!
```

**The gap:** The two operations are disconnected. The auth user ID never makes it into the `users` table.

---

## Why This Breaks Module Inheritance

### Database Triggers Explicitly Check for auth_id

**[Role Training Trigger](supabase/migrations/20251213_auto_sync_role_training.sql:7-10):**
```sql
IF NEW.auth_id IS NULL THEN
  RETURN NEW;  -- ❌ Exits early, no training assigned!
END IF;
```

**[Department Training Trigger](supabase/migrations/20251129083200_auto_sync_department_training.sql:8-10):**
```sql
IF NEW.auth_id IS NULL THEN
  RETURN NEW;  -- ❌ Exits early, no training assigned!
END IF;
```

**Result:** When users without `auth_id` are created or updated, triggers skip them entirely.

---

## Solutions

### Solution 1: Immediate Fix - Backfill Missing auth_id (5 minutes)

Create a script to match users by email and populate auth_id.

**When to use:** Right now, to fix the 6 affected users

**Script:** (see below)

---

### Solution 2: Fix User Creation Flow (Recommended - 1 hour)

Modify [UserManagementPanel.tsx](src/components/user/UserManagementPanel.tsx) to optionally create auth account during user creation.

**Changes needed:**

1. **Add password field to user form** (optional, shown when "Create Login Account" checked)
2. **Add checkbox:** "Create login account for this user"
3. **On save (if checkbox checked):**
   ```typescript
   // Step 1: Create auth user first
   const authResponse = await fetch('/api/create-auth-user', {
     method: 'POST',
     body: JSON.stringify({ email: cleanedUser.email, password }),
     headers: { ... }
   });
   const { user: authUser } = await authResponse.json();

   // Step 2: Insert into users table WITH auth_id
   const { data: newUser } = await supabase
     .from("users")
     .insert({
       ...cleanedUser,
       auth_id: authUser.id  // ✅ Now linked!
     });
   ```

**Benefits:**
- Prevents future users from being created without auth_id
- Clear UX: admin decides if user should have login
- Atomic operation: both records created together

---

### Solution 3: Enhanced create-auth-user API (Alternative - 30 minutes)

Modify [create-auth-user API](src/app/api/create-auth-user/route.ts) to accept full user details and create both records.

**Changes needed:**

```typescript
export async function POST(req: Request) {
  // ... existing auth checks ...

  const { email, password, userData } = await req.json();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // 2. Create users table record with auth_id
  if (userData) {
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        ...userData,
        auth_id: authData.user.id,  // ✅ Linked!
        email: email
      });

    if (userError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ user: authData.user }, { status: 200 });
}
```

**Benefits:**
- Single API call creates both records
- Atomic with rollback on failure
- Backward compatible (userData optional)

---

### Solution 4: Add "Create Login" Button to Existing Users (Quick Fix - 20 minutes)

Add a button in user edit modal to create login account for users who don't have one.

**UI Change in [UserManagementPanel.tsx](src/components/user/UserManagementPanel.tsx):**

```typescript
// In user edit modal
{!selectedUser.auth_id && (
  <div style={{ marginTop: 16, padding: 12, background: '#fff3cd', border: '1px solid #ffc107' }}>
    <p>⚠️ This user has no login account</p>
    <button onClick={handleCreateLogin}>Create Login Account</button>
  </div>
)}
```

**Handler:**
```typescript
const handleCreateLogin = async () => {
  const password = prompt('Enter password for user:');
  if (!password) return;

  // Create auth user
  const response = await fetch('/api/create-auth-user', {
    method: 'POST',
    body: JSON.stringify({ email: selectedUser.email, password }),
    headers: { Authorization: `Bearer ${token}` }
  });

  const { user: authUser } = await response.json();

  // Update users table with auth_id
  await supabase
    .from('users')
    .update({ auth_id: authUser.id })
    .eq('id', selectedUser.id);

  // Manually trigger training sync
  await fetch('/api/sync-training-from-profile', {
    method: 'POST',
    body: JSON.stringify({ auth_ids: [authUser.id], role_id: selectedUser.role_id })
  });

  alert('Login account created!');
};
```

---

## Recommended Approach

**Phase 1: Immediate (Today)**
1. ✅ Run backfill script to fix the 6 existing users
2. ✅ Manually trigger training sync for those 6 users

**Phase 2: Short-term (This Week)**
- Implement Solution 4: Add "Create Login" button to user edit modal
- This prevents future issues and provides visibility

**Phase 3: Long-term (Next Sprint)**
- Implement Solution 2 OR 3: Fix user creation flow
- Make it impossible to create users without auth_id (if login is needed)

---

## Impact if Not Fixed

### Current Impact (6 users)
- ❌ Cannot log in to the system
- ❌ Missing all inherited training modules from role
- ❌ Missing all inherited training modules from department
- ❌ Will not receive future automatic training assignments

### Future Impact (if creation flow not fixed)
- ⚠️ Admins will continue creating users without auth_id
- ⚠️ Each new user without auth_id increases technical debt
- ⚠️ Training compliance gaps widen
- ⚠️ Manual cleanup required periodically

---

## Next Steps

1. **Review the 6 affected users** - Are they meant to have login accounts?
2. **Run backfill script** (below) to fix existing users
3. **Choose implementation approach** (Solution 2, 3, or 4)
4. **Update user creation documentation** to clarify auth_id requirement

---

## Files Involved

**User Creation (Missing auth_id):**
- [src/components/user/UserManagementPanel.tsx](src/components/user/UserManagementPanel.tsx) (lines 589-611)
- [src/components/userview/HrAdminView.tsx](src/components/userview/HrAdminView.tsx) (line 354)
- [src/components/user/UserCSVImport.tsx](src/components/user/UserCSVImport.tsx)

**Auth User Creation (Not Linked):**
- [src/app/api/create-auth-user/route.ts](src/app/api/create-auth-user/route.ts) (lines 77-88)

**Triggers That Skip Without auth_id:**
- [supabase/migrations/20251213_auto_sync_role_training.sql](supabase/migrations/20251213_auto_sync_role_training.sql)
- [supabase/migrations/20251129083200_auto_sync_department_training.sql](supabase/migrations/20251129083200_auto_sync_department_training.sql)

**Login Page (Requires auth_id):**
- [src/app/login/page.tsx](src/app/login/page.tsx) (line 45)

---

## Backfill Script

See: `scripts/backfill-missing-auth-ids.ts` (to be created)
