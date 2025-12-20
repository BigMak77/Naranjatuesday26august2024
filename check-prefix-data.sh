#!/bin/bash

# Check user location
echo "=== Checking User Location ==="
psql "$SUPABASE_DB_URL" -c "SELECT id, first_name, last_name, location FROM users LIMIT 5;"

echo ""
echo "=== Checking Document Types with ref_code ==="
psql "$SUPABASE_DB_URL" -c "SELECT id, name, ref_code FROM document_types ORDER BY name;"

echo ""
echo "=== Checking Sections with code ==="
psql "$SUPABASE_DB_URL" -c "SELECT id, code, title, ref_code FROM standard_sections ORDER BY code LIMIT 10;"
