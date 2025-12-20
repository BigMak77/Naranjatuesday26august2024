#!/bin/bash

# Fix Question Packs RLS Policies
# This script applies the RLS policy fixes for the TestBuilder component

echo "🔧 Applying Question Packs RLS Policy Fixes..."

# Apply the migration
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Question Packs RLS policies applied successfully!"
    echo ""
    echo "📋 What was fixed:"
    echo "   - Added RLS policies for admins/trainers to manage question_packs"
    echo "   - Added RLS policies for admins/trainers to manage questions"  
    echo "   - Added RLS policies for admins/trainers to manage question_options"
    echo "   - Granted necessary INSERT/UPDATE/DELETE permissions"
    echo ""
    echo "🎯 Who can now manage tests:"
    echo "   - Users with access_level: 'Super Admin' or 'Admin'"
    echo "   - Users with permission: 'canManageTraining'"
    echo "   - Users with permission: 'canAccessTrainer'"
    echo ""
    echo "✨ TestBuilder should now work properly!"
else
    echo "❌ Failed to apply migration. Please check the logs."
    echo ""
    echo "🔍 You can manually apply the migration by running:"
    echo "   supabase db push"
    echo ""
    echo "Or check if there are any conflicts in the RLS policies."
fi
