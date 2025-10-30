#!/usr/bin/env node

/**
 * Test script to verify that navigation fixes are working correctly
 * and no components are causing excessive history.replaceState() calls
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Navigation Fixes...\n');

// Test 1: Check if useRouterSafe hook exists and is properly implemented
console.log('1. Checking useRouterSafe hook...');
const routerSafePath = path.join(__dirname, 'src/lib/useRouterSafe.ts');
if (fs.existsSync(routerSafePath)) {
  const content = fs.readFileSync(routerSafePath, 'utf8');
  if (content.includes('callCountRef') && content.includes('debounceMs')) {
    console.log('   ✅ useRouterSafe hook is properly implemented');
  } else {
    console.log('   ❌ useRouterSafe hook is missing key functionality');
  }
} else {
  console.log('   ❌ useRouterSafe hook file not found');
}

// Test 2: Check critical components for safe router usage
console.log('\n2. Checking components for safe router usage...');

const criticalComponents = [
  'src/app/hr/structure/page.tsx',
  'src/components/RequireAccess.tsx',
  'src/components/AccessControlWrapper.tsx',
  'src/components/audit/AuditManager.tsx'
];

let allGood = true;

criticalComponents.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if using safe router
    if (content.includes('useRouterSafe')) {
      console.log(`   ✅ ${componentPath} uses useRouterSafe`);
    } else if (content.includes('useRouter')) {
      console.log(`   ⚠️  ${componentPath} still uses regular useRouter`);
      allGood = false;
    }
    
    // Check for router in dependency arrays
    if (content.match(/, router\]/)) {
      console.log(`   ⚠️  ${componentPath} still has router in dependency array`);
      allGood = false;
    }
  } else {
    console.log(`   ❌ ${componentPath} not found`);
    allGood = false;
  }
});

// Test 3: Check for potential infinite loop patterns
console.log('\n3. Checking for potential infinite loop patterns...');

function checkForInfiniteLoops(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      checkForInfiniteLoops(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for useEffect with router in deps
      if (content.match(/useEffect\([^}]+router\]/m)) {
        console.log(`   ⚠️  Potential issue in ${filePath.replace(__dirname + '/', '')}`);
        allGood = false;
      }
      
      // Check for immediate redirects in useEffect
      if (content.match(/useEffect\(\(\) => \{[^}]*router\.(push|replace)\(/m)) {
        const hasEmptyDeps = content.match(/useEffect\(\(\) => \{[^}]*router\.(push|replace)\([^}]+\}, \[\]/m);
        if (!hasEmptyDeps) {
          console.log(`   ⚠️  Potential redirect loop in ${filePath.replace(__dirname + '/', '')}`);
        }
      }
    }
  });
}

try {
  checkForInfiniteLoops(path.join(__dirname, 'src'));
  
  if (allGood) {
    console.log('   ✅ No infinite loop patterns detected');
  }
} catch (error) {
  console.log(`   ❌ Error checking for infinite loops: ${error.message}`);
}

console.log('\n📊 Summary:');
if (allGood) {
  console.log('✅ All navigation fixes appear to be properly implemented!');
  console.log('🚀 The history.replaceState() error should be resolved.');
} else {
  console.log('⚠️  Some issues were detected. Please review the warnings above.');
}

console.log('\n💡 Additional recommendations:');
console.log('- Test your application thoroughly in development mode');
console.log('- Monitor browser console for any remaining navigation errors');
console.log('- Consider adding error boundaries around navigation-heavy components');
