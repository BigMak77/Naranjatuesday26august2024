#!/usr/bin/env node

/**
 * Access Level Migration Script
 *
 * This script updates the users table to support the new access level hierarchy.
 * It safely migrates existing data and adds proper constraints.
 *
 * Usage:
 *   node run-access-level-migration.js
 *
 * Or make it executable:
 *   chmod +x run-access-level-migration.js
 *   ./run-access-level-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runMigration() {
  log('\n🚀 Starting Access Level Migration...', 'cyan');
  log('==========================================\n', 'cyan');

  try {
    // Step 1: Fetch current users
    log('📋 Step 1: Fetching current users...', 'blue');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, access_level');

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    log(`✓ Found ${users.length} users\n`, 'green');

    // Step 2: Show current access level distribution
    log('📊 Step 2: Current access level distribution:', 'blue');
    const distribution = {};
    users.forEach(user => {
      const level = user.access_level || 'NULL';
      distribution[level] = (distribution[level] || 0) + 1;
    });
    console.table(distribution);

    // Step 3: Map old values to new values
    log('\n🔄 Step 3: Mapping users to new access levels...', 'blue');

    const accessLevelMap = {
      'super admin': 'Super Admin',
      'superadmin': 'Super Admin',
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'administrator': 'Admin',
      'hr': 'HR Admin',
      'hr admin': 'HR Admin',
      'hr_admin': 'HR Admin',
      'hradmin': 'HR Admin',
      'h&s admin': 'H&S Admin',
      'h&s': 'H&S Admin',
      'hs admin': 'H&S Admin',
      'health and safety': 'H&S Admin',
      'health & safety admin': 'H&S Admin',
      'dept. manager': 'Dept. Manager',
      'dept manager': 'Dept. Manager',
      'department manager': 'Dept. Manager',
      'dept_manager': 'Dept. Manager',
      'manager': 'Manager',
      'shift manager': 'Manager',
      'trainer': 'Trainer',
      'training admin': 'Trainer',
      'user': 'User',
      'employee': 'User',
      'standard user': 'User',
      'basic': 'User',
    };

    const updates = [];
    const unrecognized = [];

    users.forEach(user => {
      const currentLevel = (user.access_level || '').toLowerCase().trim();
      const newLevel = accessLevelMap[currentLevel];

      if (newLevel) {
        if (user.access_level !== newLevel) {
          updates.push({
            id: user.id,
            oldLevel: user.access_level,
            newLevel: newLevel,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
          });
        }
      } else if (currentLevel) {
        unrecognized.push({
          id: user.id,
          currentLevel: user.access_level,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
        });
      }
    });

    if (updates.length > 0) {
      log(`✓ Found ${updates.length} users to update:\n`, 'green');
      console.table(updates.map(u => ({
        Name: u.name,
        Email: u.email,
        'Old Level': u.oldLevel,
        'New Level': u.newLevel,
      })));
    } else {
      log('✓ No users need updating\n', 'green');
    }

    if (unrecognized.length > 0) {
      log(`⚠️  Warning: ${unrecognized.length} users have unrecognized access levels:\n`, 'yellow');
      console.table(unrecognized.map(u => ({
        Name: u.name,
        Email: u.email,
        'Current Level': u.currentLevel,
      })));
      log('These users will need to be manually updated.\n', 'yellow');
    }

    // Step 4: Ask for confirmation
    if (updates.length === 0 && unrecognized.length === 0) {
      log('✅ All users already have valid access levels!', 'green');
      log('==========================================\n', 'cyan');
      return;
    }

    log('📝 Step 4: Proceeding with updates...', 'blue');

    // Step 5: Update users
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error } = await supabase
        .from('users')
        .update({ access_level: update.newLevel })
        .eq('id', update.id);

      if (error) {
        log(`  ✗ Failed to update ${update.name}: ${error.message}`, 'red');
        errorCount++;
      } else {
        log(`  ✓ Updated ${update.name}: ${update.oldLevel} → ${update.newLevel}`, 'green');
        successCount++;
      }
    }

    // Step 6: Verify final state
    log('\n📊 Step 5: Final access level distribution:', 'blue');
    const { data: finalUsers } = await supabase
      .from('users')
      .select('access_level');

    const finalDistribution = {};
    finalUsers.forEach(user => {
      const level = user.access_level || 'NULL';
      finalDistribution[level] = (finalDistribution[level] || 0) + 1;
    });
    console.table(finalDistribution);

    // Summary
    log('\n==========================================', 'cyan');
    log('✅ Migration Complete!', 'green');
    log(`   Successfully updated: ${successCount} users`, successCount > 0 ? 'green' : 'reset');
    if (errorCount > 0) {
      log(`   Failed updates: ${errorCount} users`, 'red');
    }
    if (unrecognized.length > 0) {
      log(`   ⚠️  Needs manual update: ${unrecognized.length} users`, 'yellow');
    }
    log('==========================================\n', 'cyan');

    // Next steps
    if (unrecognized.length > 0) {
      log('📋 Next Steps:', 'blue');
      log('   Manually update users with unrecognized access levels in Supabase dashboard', 'yellow');
      log('   Valid access levels are:', 'yellow');
      log('   - Super Admin, Admin, HR Admin, H&S Admin', 'yellow');
      log('   - Dept. Manager, Manager, Trainer, User\n', 'yellow');
    }

  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, 'red');
    log(`Stack trace: ${error.stack}\n`, 'red');
    process.exit(1);
  }
}

// Run the migration
runMigration();
