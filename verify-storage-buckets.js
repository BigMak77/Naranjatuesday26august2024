#!/usr/bin/env node

/**
 * Verification script to check storage bucket references
 * Run with: node verify-storage-buckets.js
 */

const fs = require('fs');
const path = require('path');

// Expected bucket names from our configuration
const EXPECTED_BUCKETS = [
  'documents',
  'modules', 
  'training-materials',
  'issue-evidence',
  'job-applications'
];

// Legacy bucket names that should NOT be found
const LEGACY_BUCKETS = [
  'NARANJA DOCS',
  'MODULES',
  'applications-cv'
];

function searchFiles(dir, extension = '.tsx') {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(searchFiles(filePath, extension));
    } else if (file.endsWith(extension) || file.endsWith('.ts') || file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  
  return results;
}

function checkBucketReferences() {
  const srcDir = path.join(__dirname, 'src');
  const files = searchFiles(srcDir);
  
  let issues = [];
  let bucketReferences = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for .from() patterns
    const fromMatches = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/g);
    if (fromMatches) {
      fromMatches.forEach(match => {
        const bucket = match.match(/\.from\(['"`]([^'"`]+)['"`]\)/)[1];
        bucketReferences.push({ file, bucket, line: getLineNumber(content, match) });
        
        // Check if it's a legacy bucket
        if (LEGACY_BUCKETS.includes(bucket)) {
          issues.push({
            type: 'LEGACY_BUCKET',
            file: file.replace(__dirname + '/', ''),
            bucket,
            line: getLineNumber(content, match)
          });
        }
        
        // Check if it's an unexpected bucket
        if (!EXPECTED_BUCKETS.includes(bucket) && !bucket.startsWith('STORAGE_BUCKETS.')) {
          issues.push({
            type: 'UNEXPECTED_BUCKET',
            file: file.replace(__dirname + '/', ''),
            bucket,
            line: getLineNumber(content, match)
          });
        }
      });
    }
    
    // Check for hardcoded bucket strings in other contexts
    LEGACY_BUCKETS.forEach(legacyBucket => {
      if (content.includes(`"${legacyBucket}"`) || content.includes(`'${legacyBucket}'`)) {
        issues.push({
          type: 'HARDCODED_LEGACY',
          file: file.replace(__dirname + '/', ''),
          bucket: legacyBucket,
          line: getLineNumber(content, legacyBucket)
        });
      }
    });
  }
  
  return { issues, bucketReferences };
}

function getLineNumber(content, searchString) {
  const lines = content.substring(0, content.indexOf(searchString)).split('\n');
  return lines.length;
}

// Run the check
console.log('🔍 Checking storage bucket references...\n');

const { issues, bucketReferences } = checkBucketReferences();

if (issues.length === 0) {
  console.log('✅ All storage bucket references are correctly standardized!');
  console.log(`\n📊 Found ${bucketReferences.length} bucket references total:`);
  
  // Group by bucket
  const groupedRefs = bucketReferences.reduce((acc, ref) => {
    if (!acc[ref.bucket]) acc[ref.bucket] = [];
    acc[ref.bucket].push(ref);
    return acc;
  }, {});
  
  Object.keys(groupedRefs).forEach(bucket => {
    console.log(`   ${bucket}: ${groupedRefs[bucket].length} references`);
  });
  
} else {
  console.log('❌ Found storage bucket issues:\n');
  
  issues.forEach(issue => {
    console.log(`${issue.type}: ${issue.file}:${issue.line}`);
    console.log(`   Using bucket: "${issue.bucket}"`);
    console.log('');
  });
  
  console.log('\n💡 Recommendations:');
  console.log('1. Replace legacy bucket names with STORAGE_BUCKETS constants');
  console.log('2. Import { STORAGE_BUCKETS } from "@/lib/storage-config"');
  console.log('3. Use STORAGE_BUCKETS.DOCUMENTS instead of "documents"');
}

console.log('\n🎯 Expected bucket names:');
EXPECTED_BUCKETS.forEach(bucket => {
  console.log(`   - ${bucket}`);
});
