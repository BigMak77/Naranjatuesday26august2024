## Critical Fix: Department Training Auto-Sync Trigger

**Issue:** The department training sync trigger currently **ignores** the user's direct `department_id` field and only looks at their role's department. This means when users change departments directly, they don't automatically get the new department's training.

**Impact:**
- 12 users have mismatched department IDs (user's dept != role's dept)
- Users won't get training updates when moving between departments
- Manual fixes required after department changes

---

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended - 2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb)
2. Navigate to **SQL Editor**
3. Copy and paste the entire SQL from `supabase/migrations/20251213_fix_department_training_sync.sql`
4. Click **Run**

✅ Done! The trigger will now work correctly.

---

### Option 2: Via Supabase CLI

```bash
cd "/Users/bigmak/Documents/Naranja 4.3 copy"

# Login to Supabase
npx supabase link --project-ref igzucjhzvghlhpqmgolb

# Apply the migration
cat supabase/migrations/20251213_fix_department_training_sync.sql | \
  npx supabase db execute
```

---

## What This Fix Does

### Before (Current Behavior - ❌ Broken)
```sql
-- Only looks at role's department
SELECT department_id INTO dept_id
FROM roles
WHERE id = NEW.role_id;
```

**Problem:** If a user has a direct `department_id` set, it's ignored!

### After (Fixed Behavior - ✅ Correct)
```sql
-- Use user's DIRECT department_id first
dept_id := NEW.department_id;

-- Fall back to role's department if not set
IF dept_id IS NULL AND NEW.role_id IS NOT NULL THEN
  SELECT department_id INTO dept_id
  FROM roles
  WHERE id = NEW.role_id;
END IF;
```

**Benefit:** Now respects the user's actual department assignment!

---

## What Changes

### Trigger Behavior Changes:

**Before:**
- ❌ Only triggers on `role_id` changes
- ❌ Only looks at role's department
- ❌ Ignores user's direct `department_id`

**After:**
- ✅ Triggers on **both** `department_id` AND `role_id` changes
- ✅ Checks user's direct `department_id` first
- ✅ Falls back to role's department if needed

---

## Testing the Fix

After applying the migration, test it by changing a user's department:

```typescript
// This will now automatically assign department training
await supabase
  .from('users')
  .update({ department_id: 'new-dept-id' })
  .eq('auth_id', 'user-id');
```

The trigger will automatically:
1. Detect the `department_id` change
2. Look up all modules assigned to the new department
3. Insert them into `user_assignments` for this user

---

## Verification

After applying the fix, run this to verify:

```bash
npx tsx scripts/find-missed-users.ts
```

Should show: `✅ All users have correct module assignments!`

---

## SQL Migration File Location

**File:** [`supabase/migrations/20251213_fix_department_training_sync.sql`](supabase/migrations/20251213_fix_department_training_sync.sql)

---

## Why This Matters

Currently **516 out of 516 users** have a direct `department_id` field set. The system is designed to support users having a department independent of their role. The trigger MUST respect this.

**Use Cases:**
- User transferred from Engineering to QA (different dept, same company)
- User promoted to manager role but stays in same department
- User temporarily assigned to different department for project work

All of these scenarios require the trigger to check the user's direct `department_id`.
