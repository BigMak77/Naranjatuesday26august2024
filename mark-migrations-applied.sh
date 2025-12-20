#!/bin/bash

echo "🔧 Marking previously applied migrations in the schema_migrations table..."
echo ""

# This script marks migrations as applied that were manually run
# This allows `npx supabase db push` to work correctly

npx supabase db execute <<'SQL'
-- Mark migrations as applied (they were run manually but not recorded)
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20251210', '20251210_refactor_follow_up_system', ARRAY[]::text[]),
  ('20251211', '20251211_rename_review_period_to_follow_up_period', ARRAY[]::text[]),
  ('20251212', '20251212_add_prefix_to_module_categories', ARRAY[]::text[]),
  ('20251213', '20251213_auto_set_auth_id', ARRAY[]::text[]),
  ('20251213', '20251213_auto_sync_role_training', ARRAY[]::text[]),
  ('20251213', '20251213_fix_department_training_sync', ARRAY[]::text[]),
  ('20251214', '20251214_add_user_login_times_function', ARRAY[]::text[]),
  ('20251216', '20251216_add_location_to_users', ARRAY[]::text[]),
  ('20251216', '20251216_create_document_modules_junction', ARRAY[]::text[]),
  ('20251216', '20251216_create_trainer_permissions', ARRAY[]::text[]),
  ('20251217', '20251217_add_prefix_to_document_types', ARRAY[]::text[]),
  ('20251217', '20251217_add_ref_codes_for_composite_prefix', ARRAY[]::text[]),
  ('20251218', '20251218_populate_document_type_ref_codes', ARRAY[]::text[]),
  ('20251218', '20251218_populate_section_ref_codes', ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;

SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 20;
SQL

echo ""
echo "✅ Migrations marked as applied"
echo ""
echo "Now you can run: npx supabase db push"
