#!/bin/bash

# Access Control Wrapper Cleanup Script
# This script helps identify and remove deprecated access control components

echo "🔍 Access Control Wrapper Cleanup"
echo "================================="

# Check for any remaining usage of deprecated wrappers
echo "Checking for remaining usage of deprecated wrappers..."

echo "📋 Searching for PermissionWrapper usage:"
grep -r "PermissionWrapper" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" || echo "✅ No PermissionWrapper usage found"

echo ""
echo "📋 Searching for RequireAccess usage:"
grep -r "RequireAccess" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" || echo "✅ No RequireAccess usage found"

echo ""
echo "📋 Searching for ManagerAccessGuard usage:"
grep -r "ManagerAccessGuard" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" || echo "✅ No ManagerAccessGuard usage found"

echo ""
echo "📋 Checking for AccessControlWrapper usage:"
usage_count=$(grep -r "AccessControlWrapper" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" | wc -l)
echo "✅ Found $usage_count usages of AccessControlWrapper"

echo ""
echo "🗑️  Deprecated files that can be removed:"
echo "- src/components/PermissionWrapper.tsx"
echo "- src/components/RequireAccess.tsx" 
echo "- src/components/manager/ManagerAccessGuard.tsx"

echo ""
echo "⚠️  Manual verification required before removal:"
echo "1. Ensure all access control functionality is working"
echo "2. Test authentication and authorization flows"
echo "3. Verify redirect behavior is correct"
echo "4. Check that all protected routes work as expected"

echo ""
echo "🚀 To remove deprecated files (after testing):"
echo "rm src/components/PermissionWrapper.tsx"
echo "rm src/components/RequireAccess.tsx"
echo "rm src/components/manager/ManagerAccessGuard.tsx"

echo ""
echo "✅ Migration complete! Check the ACCESS_CONTROL_MIGRATION_GUIDE.md for details."
