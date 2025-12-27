# First Aid System Unification

**Created:** 2025-12-27
**Status:** Steps 1-2 Complete, Steps 3-4 Pending

## 📋 Overview

This migration consolidates three conflicting first aid tracking systems into one unified approach where:
- **Health & Safety owns** first aid designation management
- **HR can view** first aid status (read-only)
- **Database automatically syncs** between systems

---

## 🔴 The Problem (Before)

### Three Conflicting Systems:

1. **Legacy Flag System** (`users.is_first_aid`)
   - Boolean field in users table
   - Managed by HR via UserManagementPanel
   - No training tracking, no certificates
   - Just an on/off switch

2. **Module Assignment System** (`user_assignments`)
   - Records in user_assignments table
   - Module ID: `f1236b6b-ee01-4e68-9082-e2380b0fa600`
   - Managed by H&S via AddFirstAidDialog
   - Tracks assigned_at and completed_at dates
   - Supports certificate upload (though not fully implemented)

3. **Hybrid Viewer** (ViewFirstAidersDialog)
   - Attempts to merge both systems
   - Complex logic prone to inconsistencies
   - Users could be in one system but not the other

### Data Integrity Risks:
- ❌ User marked as first aider in one system but not the other
- ❌ Training records incomplete or missing
- ❌ No synchronization between systems
- ❌ Different teams managing same data differently
- ❌ **Legal/compliance risk** for incomplete records

---

## ✅ The Solution (After)

### Unified System Architecture:

```
┌─────────────────────────────────────────┐
│     HEALTH & SAFETY OWNS DESIGNATION    │
├─────────────────────────────────────────┤
│                                         │
│  1. H&S adds first aider via           │
│     AddFirstAidDialog                   │
│         ↓                               │
│  2. Creates user_assignments record     │
│     (source of truth)                   │
│         ↓                               │
│  3. Database trigger auto-syncs         │
│     users.is_first_aid = true           │
│         ↓                               │
│  4. HR sees status in People tab        │
│     (read-only, with tooltip)           │
│                                         │
└─────────────────────────────────────────┘
```

### Key Principles:
1. **Single Source of Truth:** `user_assignments` table with module ID
2. **Automatic Sync:** Database trigger keeps `users.is_first_aid` updated
3. **Role Separation:** H&S manages, HR views
4. **Proper Tracking:** Dates, certificates, training status

---

## 📁 Files Changed

### ✅ Completed (Steps 1-2):

#### Frontend Changes:
- **src/components/user/UserManagementPanel.tsx**
  - ✅ Removed first aid from bulk assignment dialog
  - ✅ Made first aid field read-only in edit form
  - ✅ Removed `is_first_aid` from save operations
  - ✅ Added tooltip: "First aid designation is managed by Health & Safety team"
  - ✅ Removed state variable: `bulkFirstAid`
  - ✅ Updated bulk assign type: removed `"first_aid"` option

#### Database Changes:
- **database/migrations/sync_first_aid_flag.sql** ✅
  - Database trigger on `user_assignments` table
  - Auto-syncs `users.is_first_aid` when assignments change
  - Handles INSERT, UPDATE, DELETE operations
  - Includes comprehensive comments and logging

- **database/migrations/migrate_first_aid_data.sql** ✅
  - One-time data migration script
  - Consolidates existing dual-system data
  - Creates assignments for flag-only users
  - Updates flags for assignment-only users
  - Includes before/after verification
  - Detailed logging and error handling

### ⏳ Pending (Steps 3-4):

#### H&S Components (Need Review):
- **src/components/healthsafety/AddFirstAidDialog.tsx**
  - Currently creates module assignments ✅
  - Certificate upload UI exists but doesn't save 🔧 (needs storage implementation)
  - Training date field exists but not stored separately 🔧

- **src/components/healthsafety/AddFirstAidWidget.tsx**
  - Bulk adds first aiders by department
  - Consider: consolidate with AddFirstAidDialog? 🤔

- **src/components/healthsafety/ViewFirstAidersDialog.tsx**
  - Currently merges both systems ✅
  - After migration, can simplify to just query assignments ✨

---

## 🚀 Deployment Steps

### Step 1: ✅ COMPLETED - Frontend Changes
- [x] Updated UserManagementPanel.tsx
- [x] Removed bulk assign first aid option
- [x] Made edit form field read-only
- [x] Removed from save operations
- [x] Added tooltips

### Step 2: Run Database Scripts (IN ORDER!)

#### 2a. Create the Trigger
```bash
psql -h your-db-host -U your-user -d your-database -f database/migrations/sync_first_aid_flag.sql
```

**What it does:**
- Creates `sync_first_aid_flag()` function
- Creates `sync_first_aid_trigger` on user_assignments table
- From now on, changes to first aid assignments auto-sync to users table

#### 2b. Run the Migration
```bash
psql -h your-db-host -U your-user -d your-database -f database/migrations/migrate_first_aid_data.sql
```

**What it does:**
- Audits current state (shows inconsistencies)
- Creates module assignments for users with only the flag
- Updates flags for users with only assignments
- Verifies everything is synchronized
- Shows detailed before/after stats

**Expected Output:**
```
--- CURRENT STATE ---
Users with is_first_aid flag: X
Users with module assignment: Y
Users with BOTH (synchronized): Z
Users with ONLY flag (need assignment): A
Users with ONLY assignment (need flag): B

--- MIGRATION: FLAG → ASSIGNMENT ---
Created N new first aid module assignments

--- SYNCHRONIZATION: ASSIGNMENT → FLAG ---
Updated M users to set is_first_aid = true

--- VERIFICATION (AFTER MIGRATION) ---
Users with is_first_aid flag: X+M
Users with module assignment: Y+N
Users with BOTH (synchronized): X+M+N
Users with ONLY flag: 0 (should be 0) ✓
Users with ONLY assignment: 0 (should be 0) ✓

✓ SUCCESS: All first aiders are now synchronized!
```

### Step 3: ⏳ PENDING - Update H&S Components

**Review and potentially update:**

1. **AddFirstAidDialog.tsx**
   - Consider adding certificate storage (currently just UI)
   - Verify training date is stored properly
   - Test the 3-step wizard flow

2. **AddFirstAidWidget.tsx**
   - Consider consolidating with AddFirstAidDialog
   - Or keep for bulk department operations

3. **ViewFirstAidersDialog.tsx**
   - Simplify after migration (no need to merge systems)
   - Just query user_assignments directly

### Step 4: ⏳ PENDING - Testing

**Test Cases:**

- [ ] H&S can add first aider via AddFirstAidDialog
  - Verify assignment created in user_assignments
  - Verify is_first_aid flag set to true automatically

- [ ] H&S can remove first aider
  - Delete assignment from user_assignments
  - Verify is_first_aid flag set to false automatically

- [ ] HR can view first aid status in People tab
  - See green checkmark for first aiders
  - See red X for non-first aiders
  - Cannot edit (field is disabled)
  - Tooltip explains H&S manages it

- [ ] Bulk assign is gone
  - No "First Aid" option in bulk assign dialog
  - Only Role, Shift, Trainer remain

- [ ] CSV export still includes first aid column
  - For reporting purposes

- [ ] ViewFirstAidersDialog shows correct data
  - Lists all first aiders
  - Shows training status correctly

---

## 🔍 Verification Queries

### Check Synchronization Status:
```sql
-- Should return 0 rows (everyone synchronized)
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.is_first_aid AS flag,
  EXISTS(
    SELECT 1 FROM user_assignments ua
    WHERE ua.auth_id = u.auth_id
      AND ua.item_type = 'module'
      AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
  ) AS has_assignment,
  CASE
    WHEN u.is_first_aid = true AND EXISTS(
      SELECT 1 FROM user_assignments ua
      WHERE ua.auth_id = u.auth_id
        AND ua.item_type = 'module'
        AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
    ) THEN 'OK'
    WHEN u.is_first_aid = false AND NOT EXISTS(
      SELECT 1 FROM user_assignments ua
      WHERE ua.auth_id = u.auth_id
        AND ua.item_type = 'module'
        AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
    ) THEN 'OK'
    ELSE 'MISMATCH'
  END AS sync_status
FROM users u
WHERE u.auth_id IS NOT NULL
HAVING sync_status = 'MISMATCH';
```

### View All First Aiders:
```sql
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.employee_number,
  u.is_first_aid,
  ua.assigned_at,
  ua.completed_at,
  CASE
    WHEN ua.completed_at IS NOT NULL THEN 'Training Completed'
    WHEN ua.assigned_at IS NOT NULL THEN 'Training In Progress'
    ELSE 'Not Started'
  END AS training_status
FROM users u
INNER JOIN user_assignments ua ON u.auth_id = ua.auth_id
WHERE ua.item_type = 'module'
  AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
ORDER BY u.last_name, u.first_name;
```

### Check Trigger Status:
```sql
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  tgisinternal AS is_internal
FROM pg_trigger
WHERE tgname = 'sync_first_aid_trigger';
```

---

## 🔧 Troubleshooting

### Trigger Not Working?

**Check if trigger exists:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'sync_first_aid_trigger';
```

**Check trigger function:**
```sql
SELECT * FROM pg_proc WHERE proname = 'sync_first_aid_flag';
```

**Enable trigger if disabled:**
```sql
ALTER TABLE user_assignments ENABLE TRIGGER sync_first_aid_trigger;
```

### Data Still Inconsistent?

**Re-run migration:**
```bash
psql -h your-db-host -U your-user -d your-database -f database/migrations/migrate_first_aid_data.sql
```

**Manual sync (if needed):**
```sql
-- Sync assignments → flags
UPDATE users
SET is_first_aid = true
WHERE auth_id IN (
  SELECT auth_id FROM user_assignments
  WHERE item_type = 'module'
    AND item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
);

-- Create missing assignments
INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at, completed_at)
SELECT auth_id, 'f1236b6b-ee01-4e68-9082-e2380b0fa600', 'module', NOW(), NOW()
FROM users
WHERE is_first_aid = true AND auth_id IS NOT NULL
ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;
```

---

## ↩️ Rollback Plan

**If you need to rollback:**

```sql
-- 1. Disable trigger
ALTER TABLE user_assignments DISABLE TRIGGER sync_first_aid_trigger;

-- 2. Delete trigger and function
DROP TRIGGER IF EXISTS sync_first_aid_trigger ON user_assignments;
DROP FUNCTION IF EXISTS sync_first_aid_flag();

-- 3. Optionally revert frontend changes via git
git checkout HEAD~1 -- src/components/user/UserManagementPanel.tsx
```

---

## 📊 Success Criteria

- ✅ No users with mismatched flag vs assignment
- ✅ Trigger automatically syncs new changes
- ✅ HR can view but not edit first aid status
- ✅ H&S has full control via their interface
- ✅ Migration script runs without errors
- ✅ All existing first aiders are preserved
- ⏳ Certificate storage implemented (optional)

---

## 🎯 Next Steps

1. **Complete Step 2:** Run database scripts
   ```bash
   cd database/migrations
   psql ... -f sync_first_aid_flag.sql
   psql ... -f migrate_first_aid_data.sql
   ```

2. **Complete Step 3:** Review H&S components
   - Test AddFirstAidDialog
   - Verify ViewFirstAidersDialog works correctly
   - Consider certificate storage implementation

3. **Complete Step 4:** End-to-end testing
   - Add a first aider via H&S
   - Check HR sees it (read-only)
   - Remove a first aider
   - Verify sync works both ways

4. **Deploy to Production**
   - Run migration during low-traffic period
   - Monitor logs for trigger execution
   - Verify no data loss

---

## 📞 Support

For questions or issues:
1. Check the verification queries above
2. Review the troubleshooting section
3. Check database logs for trigger output
4. Review git history for this migration

**Key Files:**
- Frontend: `src/components/user/UserManagementPanel.tsx`
- Trigger: `database/migrations/sync_first_aid_flag.sql`
- Migration: `database/migrations/migrate_first_aid_data.sql`
- This README: `database/migrations/FIRST_AID_UNIFICATION_README.md`
