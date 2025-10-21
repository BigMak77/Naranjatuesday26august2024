#!/bin/bash

# SQL Files Cleanup Script
# This script moves unnecessary SQL files to a backup folder for review

echo "🧹 Starting SQL files cleanup..."

# Create backup directory
BACKUP_DIR="./sql_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Created backup directory: $BACKUP_DIR"

# Function to move file to backup
move_to_backup() {
    local file="$1"
    if [ -f "$file" ]; then
        mv "$file" "$BACKUP_DIR/"
        echo "  ✅ Moved: $file"
    else
        echo "  ❌ Not found: $file"
    fi
}

echo ""
echo "🗑️  Moving empty files..."
move_to_backup "emergency-recovery.sql"
move_to_backup "check-existing-first-aid-columns.sql"

echo ""
echo "🔍 Moving debug/testing files..."
move_to_backup "debug-user-assignments.sql"
move_to_backup "simple-check.sql"
move_to_backup "get-test-user-auth-id.sql"
move_to_backup "dump-assignments.sql"
move_to_backup "comprehensive-users-table-analysis.sql"
move_to_backup "check_user_assignments_structure.sql"
move_to_backup "check_user_assignments_permissions.sql"
move_to_backup "get_users_columns.sql"
move_to_backup "get-all-users-columns.sql"
move_to_backup "get-users-full-structure.sql"

echo ""
echo "🔧 Moving diagnostic files..."
move_to_backup "diagnose-documents-table.sql"
move_to_backup "diagnostic-and-force-link.sql"
move_to_backup "check-table-structure.sql"
move_to_backup "check-role-assignments-structure.sql"
move_to_backup "check-role-assignments.sql"
move_to_backup "check-users-table-for-roles.sql"
move_to_backup "check-newemployeewizard-tables.sql"
move_to_backup "check-incidents-table-structure.sql"
move_to_backup "check-access-column.sql"
move_to_backup "verify-incidents-table-columns.sql"

echo ""
echo "⚡ Moving quick fix/test files..."
move_to_backup "quick-role-check.sql"
move_to_backup "quick-structure-fix.sql"
move_to_backup "simple-add-column-test.sql"
move_to_backup "simple-access-levels.sql"
move_to_backup "simple-document-fix.sql"
move_to_backup "simple-documents-recovery.sql"
move_to_backup "simple-locations-table.sql"
move_to_backup "ultra-simple-locations.sql"

echo ""
echo "📋 Moving manual/bulk operation files..."
move_to_backup "manual-dump-user-assignments.sql"
move_to_backup "manual-documents-recovery.sql"
move_to_backup "bulk-insert-batch1.sql"

echo ""
echo "🎯 Moving likely obsolete files..."
move_to_backup "john-current-assignments.sql"
move_to_backup "john-remove-add-analysis.sql"
move_to_backup "understand-permissions-column.sql"
move_to_backup "find-correct-first-aid-column.sql"

echo ""
echo "✨ Cleanup complete!"
echo "📊 Files moved to: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Review the files in $BACKUP_DIR"
echo "2. If you're happy with the cleanup, you can delete the backup folder"
echo "3. If you need any files back, move them from the backup folder"
echo ""
echo "Files kept in main directory:"
echo "  - supabase/migrations/* (production migrations)"
echo "  - db/training_questions.sql"
echo "  - db/*-safe.sql files"
echo "  - Core schema and trigger files"
