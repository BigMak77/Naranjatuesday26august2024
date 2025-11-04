# Update RLS Policies for people_personal_information

To remove the permission restrictions and allow all authenticated users to view new starters, run the following SQL in your Supabase SQL Editor:

## Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the following:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins and HR can view all personal information" ON people_personal_information;
DROP POLICY IF EXISTS "Admins and HR can update personal information" ON people_personal_information;
DROP POLICY IF EXISTS "Admins can delete personal information" ON people_personal_information;

-- Create new policies that allow all authenticated users to view and manage
CREATE POLICY "Authenticated users can view all personal information"
  ON people_personal_information
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update personal information"
  ON people_personal_information
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete personal information"
  ON people_personal_information
  FOR DELETE
  TO authenticated
  USING (true);
```

4. Click **Run** to execute the SQL
5. Refresh your HR Admin page and the New Starters tab should now work

## Alternative: Keep the migration file
The migration file has been created at:
`supabase/migrations/20250104133000_update_people_personal_information_policies.sql`

If you need to reset your database or deploy to a new environment, this migration will be included.
