-- Check current data in all turkus tables

-- Count records in each table
SELECT 'turkus_tasks' as table_name, COUNT(*) as record_count FROM turkus_tasks
UNION ALL
SELECT 'turkus_assignments', COUNT(*) FROM turkus_assignments
UNION ALL
SELECT 'turkus_risks', COUNT(*) FROM turkus_risks
UNION ALL
SELECT 'turkus_risk_assignments', COUNT(*) FROM turkus_risk_assignments
UNION ALL
SELECT 'turkus_non_conformances', COUNT(*) FROM turkus_non_conformances
UNION ALL
SELECT 'turkus_schedules', COUNT(*) FROM turkus_schedules
UNION ALL
SELECT 'turkus_submissions', COUNT(*) FROM turkus_submissions
UNION ALL
SELECT 'turkus_submission_answers', COUNT(*) FROM turkus_submission_answers;
