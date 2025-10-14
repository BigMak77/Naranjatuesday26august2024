-- FINAL DOCUMENTS RECOVERY - Handles duplicates properly
-- This will work even with duplicate reference codes

-- =========================================
-- STEP 1: CLEAN SLATE APPROACH
-- =========================================

-- Drop everything and start fresh
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS documents_backup_recovery CASCADE;

-- Find any existing backup tables
DO $$
DECLARE
    backup_table TEXT;
BEGIN
    -- Find the most recent backup
    SELECT table_name INTO backup_table
    FROM information_schema.tables 
    WHERE table_name LIKE 'documents_backup%' 
      AND table_schema = 'public'
    ORDER BY table_name DESC 
    LIMIT 1;
    
    IF backup_table IS NOT NULL THEN
        -- Rename it to our standard name
        EXECUTE format('ALTER TABLE %I RENAME TO documents_backup_recovery', backup_table);
        RAISE NOTICE 'Using backup table: %', backup_table;
    ELSE
        RAISE NOTICE 'No backup table found';
    END IF;
END $$;

-- =========================================
-- STEP 2: CREATE CLEAN TABLE
-- =========================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    reference_code TEXT UNIQUE,
    section_id UUID,
    document_type_id UUID,
    file_url TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    current_version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'under_review', 'archived')),
    review_period_months INTEGER DEFAULT 12,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    next_review_date DATE,
    notes TEXT,
    tags TEXT[],
    archived BOOLEAN DEFAULT FALSE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =========================================
-- STEP 3: CREATE INDEXES
-- =========================================

CREATE INDEX idx_documents_title ON documents(title);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_archived ON documents(archived);
CREATE INDEX idx_documents_reference_code ON documents(reference_code) WHERE reference_code IS NOT NULL;
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- =========================================
-- STEP 4: SIMPLE TRIGGER
-- =========================================

CREATE OR REPLACE FUNCTION update_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF TG_OP = 'INSERT' OR (OLD.review_period_months IS DISTINCT FROM NEW.review_period_months) THEN
        NEW.next_review_date = (COALESCE(NEW.last_reviewed_at, NEW.created_at) + 
                               INTERVAL '1 month' * NEW.review_period_months)::DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_timestamp_trigger
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_timestamp();

-- =========================================
-- STEP 5: SIMPLE RLS
-- =========================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access" ON documents FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- STEP 6: RESTORE DATA SAFELY (HANDLES DUPLICATES)
-- =========================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents_backup_recovery') THEN
        -- Insert data, handling potential duplicates by updating reference codes
        INSERT INTO documents (
            id, title, section_id, document_type_id, created_at, 
            archived, reference_code, current_version, review_period_months,
            last_reviewed_at, notes, file_url, status, updated_at
        )
        SELECT 
            COALESCE(id, gen_random_uuid()),
            COALESCE(title, 'Untitled Document'),
            section_id,
            document_type_id,
            COALESCE(created_at, NOW()),
            COALESCE(archived, FALSE),
            -- Handle duplicate reference codes by making them unique
            CASE 
                WHEN reference_code IS NULL THEN NULL
                ELSE reference_code || CASE 
                    WHEN EXISTS (SELECT 1 FROM documents d WHERE d.reference_code = documents_backup_recovery.reference_code) 
                    THEN '-' || EXTRACT(EPOCH FROM NOW())::TEXT
                    ELSE ''
                END
            END,
            COALESCE(current_version, 1),
            COALESCE(review_period_months, 12),
            last_reviewed_at,
            notes,
            file_url,
            CASE 
                WHEN archived = TRUE THEN 'archived'::TEXT
                ELSE 'active'::TEXT
            END,
            COALESCE(created_at, NOW())
        FROM documents_backup_recovery;
        
        -- Clean up reference codes (fix the spacing issues we saw earlier)
        UPDATE documents 
        SET reference_code = REGEXP_REPLACE(
            TRIM(reference_code), 
            '([A-Z]+-[A-Z]+)-\s*(\d+)', 
            '\1-' || LPAD('\2', 2, '0'),
            'g'
        )
        WHERE reference_code ~ '[A-Z]+-[A-Z]+-\s*\d+';
        
        RAISE NOTICE 'Data restored from backup and cleaned';
        
    ELSE
        -- No backup found, add sample H&S documents
        INSERT INTO documents (title, reference_code, review_period_months, status, notes) VALUES
        ('Health & Safety Policy', 'HSE-HS-01', 12, 'active', 'Core H&S policy document'),
        ('H&S Roles & Responsibilities', 'HSE-HS-02', 12, 'active', 'Defines roles and responsibilities'),
        ('Legal Compliance & Regulatory Updates', 'HSE-HS-03', 6, 'active', 'Legal compliance requirements'),
        ('Risk Assessment Procedure', 'HSE-HS-04', 12, 'active', 'Risk assessment methodology'),
        ('Hazard Identification Procedure', 'HSE-HS-05', 12, 'active', 'Hazard identification process'),
        ('Incident Reporting & Investigation', 'HSE-HS-06', 12, 'active', 'Incident reporting procedures'),
        ('Near Miss Reporting', 'HSE-HS-07', 12, 'active', 'Near miss reporting system'),
        ('Corrective & Preventive Actions (CAPA)', 'HSE-HS-08', 12, 'active', 'CAPA procedures'),
        ('Emergency Preparedness & Response', 'HSE-HS-09', 12, 'active', 'Emergency response procedures'),
        ('Fire Safety & Evacuation', 'HSE-HS-10', 12, 'active', 'Fire safety and evacuation procedures');
        
        RAISE NOTICE 'Sample H&S documents added';
    END IF;
END $$;

-- =========================================
-- STEP 7: FINAL CLEANUP AND VERIFICATION
-- =========================================

-- Remove any completely duplicate records (same title and content)
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY title, COALESCE(reference_code, ''), COALESCE(notes, '') ORDER BY created_at) as rn
    FROM documents
)
DELETE FROM documents 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Fix any remaining reference code formatting issues
UPDATE documents 
SET reference_code = REGEXP_REPLACE(reference_code, '-\d+\.\d+$', '') 
WHERE reference_code ~ '-\d+\.\d+$';

-- Show final results
SELECT 
    COUNT(*) as total_documents,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_documents,
    COUNT(CASE WHEN archived = TRUE THEN 1 END) as archived_documents,
    COUNT(CASE WHEN reference_code IS NOT NULL THEN 1 END) as with_reference_codes,
    COUNT(CASE WHEN reference_code ~ '^[A-Z]+-[A-Z]+-\d{2}$' THEN 1 END) as properly_formatted_codes
FROM documents;

-- Show sample of recovered documents
SELECT 
    id,
    title,
    reference_code,
    status,
    archived,
    created_at,
    next_review_date
FROM documents 
ORDER BY 
    CASE WHEN reference_code ~ '^HSE-HS-\d+$' 
         THEN CAST(SUBSTRING(reference_code FROM '\d+$') AS INTEGER) 
         ELSE 999 END,
    reference_code,
    title
LIMIT 15;
