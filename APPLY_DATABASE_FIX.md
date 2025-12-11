# Database Fix: Rename Column

## Problem
The `modules` table has a column named `review_period` but the application code expects `follow_up_period`.

## Solution
Run the SQL script to rename the column.

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project: https://igzucjhzvghlhpqmgolb.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Open the file `fix_column_rename.sql` from this directory
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** or press `Cmd + Enter`

### Option 2: Using psql (if you have direct access)
```bash
psql <your-connection-string> -f fix_column_rename.sql
```

## What the script does
1. Checks if the `review_period` column exists in the `modules` table
2. If it exists, renames it to `follow_up_period`
3. Adds a helpful comment to the column
4. Verifies the change was successful

## After running the script
The error "Could not find the 'follow_up_period' column" should be resolved, and you'll be able to:
- Create new training modules
- Edit existing training modules
- Set follow-up assessment periods

## Files updated
- ✅ `src/components/modules/AddModuleTab.tsx` - Now uses `follow_up_period`
- ✅ `src/components/modules/EditModuleTab.tsx` - Now uses `follow_up_period`
- ✅ Database migration created at `supabase/migrations/20251211_rename_review_period_to_follow_up_period.sql`
- ✅ Direct SQL fix available at `fix_column_rename.sql`
