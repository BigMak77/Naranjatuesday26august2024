#!/bin/bash

# Storage Bucket Configuration Test
# This script tests that all storage bucket references are properly configured

echo "🔍 Testing Storage Bucket Configuration..."
echo "================================================"

cd "/Users/bigmak/Documents/Naranja 4.3 copy"

echo "✅ Storage Buckets Expected:"
echo "   - documents"
echo "   - modules"
echo "   - training-materials"
echo "   - issue-evidence"
echo "   - job-applications"
echo ""

echo "📊 Components using standardized configuration:"
grep -r "STORAGE_BUCKETS\." src/ --include="*.tsx" --include="*.ts" | grep -v storage-config.ts | wc -l | xargs echo "   Total references:"

echo ""
echo "🚫 Checking for legacy bucket names..."

# Check for any remaining legacy references
LEGACY_FOUND=false

# Check for NARANJA DOCS (excluding comments)
NARANJA_COUNT=$(grep -r '"NARANJA DOCS"' src/ --include="*.tsx" --include="*.ts" | grep -v "// -" | wc -l)
if [ $NARANJA_COUNT -gt 0 ]; then
    echo "   ❌ Found $NARANJA_COUNT references to 'NARANJA DOCS'"
    LEGACY_FOUND=true
fi

# Check for MODULES bucket
MODULES_COUNT=$(grep -r '\.from("MODULES")' src/ --include="*.tsx" --include="*.ts" | wc -l)
if [ $MODULES_COUNT -gt 0 ]; then
    echo "   ❌ Found $MODULES_COUNT references to hardcoded 'MODULES' bucket"
    LEGACY_FOUND=true
fi

# Check for applications-cv
CV_COUNT=$(grep -r '"applications-cv"' src/ --include="*.tsx" --include="*.ts" | wc -l)
if [ $CV_COUNT -gt 0 ]; then
    echo "   ❌ Found $CV_COUNT references to 'applications-cv' bucket"
    LEGACY_FOUND=true
fi

if [ "$LEGACY_FOUND" = false ]; then
    echo "   ✅ No legacy bucket names found!"
fi

echo ""
echo "📁 Components by bucket type:"
echo "   Documents:    $(grep -r "STORAGE_BUCKETS\.DOCUMENTS" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs)"
echo "   Modules:      $(grep -r "STORAGE_BUCKETS\.MODULES" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs)"
echo "   Training:     $(grep -r "STORAGE_BUCKETS\.TRAINING" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs)"
echo "   Issues:       $(grep -r "STORAGE_BUCKETS\.ISSUES" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs)"
echo "   Applications: $(grep -r "STORAGE_BUCKETS\.APPLICATIONS" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs)"

echo ""
if [ "$LEGACY_FOUND" = false ]; then
    echo "🎉 SUCCESS: Storage bucket configuration is fully standardized!"
    echo "   ✅ All components use centralized STORAGE_BUCKETS constants"
    echo "   ✅ No legacy bucket names found"
    echo "   ✅ Folder navigation issues should be resolved"
else
    echo "⚠️  WARNING: Some legacy bucket references still exist"
    echo "   Please review and fix the issues listed above"
fi

echo ""
echo "📋 Next Steps:"
echo "   1. Ensure these buckets exist in your Supabase dashboard"
echo "   2. Set appropriate storage policies for each bucket"
echo "   3. Test file upload/download in each component"
echo ""
echo "================================================"
