# ⚠️ REQUIRED: Add Follow-Up Assessment Columns to Database

## Problem
The `user_assignments` table is missing the columns needed to track follow-up assessments:
- `follow_up_due_date`
- `follow_up_completed_at`
- `follow_up_required`

## Solution
Run the SQL migration to add these columns.

---

## 🚀 Quick Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: **igzucjhzvghlhpqmgolb**

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy & Paste the SQL**
   - Open the file: `add-follow-up-tracking-to-assignments.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Query**
   - Click "Run" or press Ctrl+Enter
   - Wait for success message

5. **Verify**
   - You should see a table showing the 3 new columns
   - Check that there are no errors

---

### Option 2: Using psql (If you have the DATABASE_URL)

If you have the direct database connection string in your environment:

```bash
psql "YOUR_DATABASE_URL" < add-follow-up-tracking-to-assignments.sql
```

---

## ✅ What This Migration Does

1. **Adds 3 new columns to `user_assignments`:**
   - `follow_up_due_date` (TIMESTAMPTZ) - When the follow-up is due
   - `follow_up_completed_at` (TIMESTAMPTZ) - When the follow-up was completed
   - `follow_up_required` (BOOLEAN) - Whether follow-up is needed

2. **Adds helpful comments** to document each column

3. **Creates indexes** for fast queries:
   - Index for overdue follow-ups
   - Index for required follow-ups

4. **Shows verification** - Lists the new columns to confirm they were added

---

## 🎯 After Running the Migration

Once the migration is complete, the system will:
- ✅ Properly track when training completions require follow-ups
- ✅ Calculate follow-up due dates based on module review periods
- ✅ Show follow-up assessments in the TrainerView summary
- ✅ Allow trainers to mark follow-ups as complete

---

## 📋 SQL File Location

The complete SQL migration is in:
```
add-follow-up-tracking-to-assignments.sql
```

---

## 🆘 Need Help?

If you encounter any errors:
1. Check that you're in the correct project
2. Make sure you have admin/owner permissions
3. Check the Supabase logs for error details
4. The migration uses `IF NOT EXISTS` so it's safe to run multiple times
