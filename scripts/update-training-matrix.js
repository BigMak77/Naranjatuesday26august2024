#!/usr/bin/env node

/**
 * Script to replace the TrainingMatrix component with the enhanced version
 * that includes historical completion support
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Updating TrainingMatrix component with historical completion support\n');

const originalPath = path.join(__dirname, '../src/components/training/TrainingMatrix.tsx');
const enhancedPath = path.join(__dirname, '../src/components/training/TrainingMatrixWithHistory.tsx');
const backupPath = path.join(__dirname, '../src/components/training/TrainingMatrix.tsx.backup');

try {
  // Check if files exist
  if (!fs.existsSync(originalPath)) {
    console.error('❌ Original TrainingMatrix.tsx not found');
    process.exit(1);
  }

  if (!fs.existsSync(enhancedPath)) {
    console.error('❌ Enhanced TrainingMatrixWithHistory.tsx not found');
    process.exit(1);
  }

  // Create backup if it doesn't exist
  if (!fs.existsSync(backupPath)) {
    console.log('📄 Creating backup of original TrainingMatrix...');
    fs.copyFileSync(originalPath, backupPath);
    console.log('   ✅ Backup created at TrainingMatrix.tsx.backup');
  }

  // Read the enhanced version
  console.log('📄 Reading enhanced TrainingMatrix component...');
  const enhancedContent = fs.readFileSync(enhancedPath, 'utf8');

  // Replace the original with the enhanced version
  console.log('🔄 Replacing TrainingMatrix with enhanced version...');
  fs.writeFileSync(originalPath, enhancedContent);

  console.log('✅ TrainingMatrix component updated successfully!');
  
  console.log('\n📋 What changed:');
  console.log('- ✅ Added historical completion tracking');
  console.log('- ✅ Enhanced display with current vs historical completions');
  console.log('- ✅ Added legend for completion status colors');
  console.log('- ✅ Updated CSV export to include historical data');
  console.log('- ✅ Queries both user_assignments and user_training_completions tables');

  console.log('\n🎯 Next steps:');
  console.log('1. Test the updated TrainingMatrix in your browser');
  console.log('2. Perform a role change to test completion preservation');
  console.log('3. Verify historical completions show with grey background and "H" prefix');

  console.log('\n🔧 To test completion preservation:');
  console.log('   node scripts/test-completion-preservation.js');

} catch (error) {
  console.error('❌ Failed to update TrainingMatrix:', error.message);
  
  if (error.code === 'ENOENT') {
    console.error('\nFile not found. Please ensure you are running this from the project root.');
  }
  
  process.exit(1);
}
