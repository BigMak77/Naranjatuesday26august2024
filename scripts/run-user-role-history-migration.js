/**
 * Script to create the user_role_history table
 *
 * This script reads the SQL migration file and executes it using the database connection
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('❌ DATABASE_URL not found in .env.local');
      console.log('Please ensure your .env.local file contains DATABASE_URL');
      process.exit(1);
    }

    console.log('✅ Found DATABASE_URL');

    // Read the SQL files
    const tableSqlPath = path.join(__dirname, 'create-user-role-history-table.sql');
    const triggerSqlPath = path.join(__dirname, 'create-role-change-trigger.sql');

    const tableSql = fs.readFileSync(tableSqlPath, 'utf8');
    const triggerSql = fs.readFileSync(triggerSqlPath, 'utf8');

    console.log('📄 Read SQL migration files');
    console.log('🔧 Executing migration...\n');

    // Import pg for database connection
    const { Client } = require('pg');
    const client = new Client({
      connectionString: databaseUrl,
    });

    await client.connect();
    console.log('🔌 Connected to database');

    // Execute the table creation SQL
    console.log('📊 Creating user_role_history table...');
    await client.query(tableSql);

    // Execute the trigger SQL
    console.log('⚡ Creating automatic role change trigger...');
    await client.query(triggerSql);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Created:');
    console.log('   - user_role_history table');
    console.log('   - Indexes for optimal query performance');
    console.log('   - Row Level Security policies');
    console.log('   - Automatic trigger to log role/department changes');
    console.log('\n🎉 The Role History tab is now ready to use!');
    console.log('\n📝 Next steps:');
    console.log('   1. The table is ready but currently empty');
    console.log('   2. Role changes will start being logged when users change roles');
    console.log('   3. You can manually insert historical data if needed');
    console.log('   4. The UserRoleHistory component will display all role changes');

    await client.end();
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
