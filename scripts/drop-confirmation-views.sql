-- Drop existing confirmation views to ensure clean recreation
-- Run this before running add-confirmation-to-user-assignments.sql

DROP VIEW IF EXISTS pending_confirmations CASCADE;
DROP VIEW IF EXISTS confirmation_report CASCADE;
DROP FUNCTION IF EXISTS confirm_user_assignment(UUID, TEXT, TEXT, INET) CASCADE;
DROP FUNCTION IF EXISTS get_pending_confirmations_count(UUID) CASCADE;

-- This ensures a clean slate for the migration
