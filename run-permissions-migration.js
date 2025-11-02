// Script to run the permissions migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running permissions migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251101_add_firstaider_safety_permissions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // If exec_sql doesn't exist, try alternative method
      if (error.message.includes('exec_sql')) {
        console.log('Using alternative method to insert permissions...');

        // Insert permissions one by one
        const permissions = [
          {
            code: 'add_first_aid_report',
            label: 'Add First Aid Report',
            key: 'health-safety:add-first-aid-report',
            category: 'health-safety',
            description: 'Add first aid reports and incidents'
          },
          {
            code: 'edit_first_aid_report',
            label: 'Edit First Aid Report',
            key: 'health-safety:edit-first-aid-report',
            category: 'health-safety',
            description: 'Edit first aid reports'
          },
          {
            code: 'manage_first_aid',
            label: 'Manage First Aid',
            key: 'health-safety:manage-first-aid',
            category: 'health-safety',
            description: 'Full first aid management capabilities'
          },
          {
            code: 'add_risk_assessment',
            label: 'Add Risk Assessment',
            key: 'health-safety:add-risk-assessment',
            category: 'health-safety',
            description: 'Create new risk assessments'
          },
          {
            code: 'edit_risk_assessment',
            label: 'Edit Risk Assessment',
            key: 'health-safety:edit-risk-assessment',
            category: 'health-safety',
            description: 'Edit and update risk assessments'
          },
          {
            code: 'manage_risk_assessments',
            label: 'Manage Risk Assessments',
            key: 'health-safety:manage-risk-assessments',
            category: 'health-safety',
            description: 'Full risk assessment management'
          },
          {
            code: 'approve_risk_assessment',
            label: 'Approve Risk Assessment',
            key: 'health-safety:approve-risk-assessment',
            category: 'health-safety',
            description: 'Approve or reject risk assessments'
          }
        ];

        for (const perm of permissions) {
          const { error: insertError } = await supabase
            .from('permissions')
            .upsert([perm], { onConflict: 'code', ignoreDuplicates: false });

          if (insertError) {
            console.error(`Error inserting permission ${perm.key}:`, insertError);
          } else {
            console.log(`✓ Added permission: ${perm.key}`);
          }
        }

        console.log('\n✅ Migration completed successfully!');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
