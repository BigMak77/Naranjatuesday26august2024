-- Create module_categories table
CREATE TABLE IF NOT EXISTS module_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  archived BOOLEAN DEFAULT FALSE
);

-- Add RLS policies
ALTER TABLE module_categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read categories
CREATE POLICY "Allow authenticated users to read categories"
  ON module_categories
  FOR SELECT
  TO authenticated
  USING (archived = FALSE);

-- Allow admins to insert categories
CREATE POLICY "Allow admins to insert categories"
  ON module_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins to update categories
CREATE POLICY "Allow admins to update categories"
  ON module_categories
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add categories column to modules table (array of category IDs)
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS categories UUID[] DEFAULT '{}';

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_modules_categories ON modules USING GIN(categories);
