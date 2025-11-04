-- Update RLS policies for people_personal_information to allow all authenticated users

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
