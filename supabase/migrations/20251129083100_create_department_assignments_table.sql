-- Create department_assignments table for assigning training modules and documents to departments
CREATE TABLE IF NOT EXISTS department_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('module', 'document')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, item_id, type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_department_assignments_department_id ON department_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_department_assignments_item_id ON department_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_department_assignments_type ON department_assignments(type);

-- Add RLS (Row Level Security) policies
ALTER TABLE department_assignments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read department assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'department_assignments' AND policyname = 'Allow authenticated users to read department assignments'
  ) THEN
    CREATE POLICY "Allow authenticated users to read department assignments"
      ON department_assignments
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Allow authenticated users to insert department assignments (admin check can be added later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'department_assignments' AND policyname = 'Allow authenticated users to insert department assignments'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert department assignments"
      ON department_assignments
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated users to update department assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'department_assignments' AND policyname = 'Allow authenticated users to update department assignments'
  ) THEN
    CREATE POLICY "Allow authenticated users to update department assignments"
      ON department_assignments
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated users to delete department assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'department_assignments' AND policyname = 'Allow authenticated users to delete department assignments'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete department assignments"
      ON department_assignments
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add comment to table
COMMENT ON TABLE department_assignments IS 'Stores training modules and documents assigned to departments';
