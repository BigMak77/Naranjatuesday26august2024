-- Add likelihood field to turkus_risks table for automatic risk rating calculation
-- Risk Rating = Severity × Likelihood
-- Both Severity and Likelihood are on a 1-5 scale

ALTER TABLE turkus_risks 
ADD COLUMN IF NOT EXISTS likelihood INTEGER DEFAULT 3 CHECK (likelihood >= 1 AND likelihood <= 5);

ALTER TABLE turkus_risks 
ADD COLUMN IF NOT EXISTS risk_rating INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN severity = 'Low' THEN 1
    WHEN severity = 'Medium' THEN 3
    WHEN severity = 'High' THEN 4
    WHEN severity = 'Critical' THEN 5
    ELSE 3
  END * COALESCE(likelihood, 3)
) STORED;

-- Add helpful comment
COMMENT ON COLUMN turkus_risks.likelihood IS 'Likelihood rating from 1 (Rare) to 5 (Almost Certain)';
COMMENT ON COLUMN turkus_risks.risk_rating IS 'Calculated risk rating (Severity × Likelihood), range 1-25';

-- Update existing records to have default likelihood if null
UPDATE turkus_risks SET likelihood = 3 WHERE likelihood IS NULL;
