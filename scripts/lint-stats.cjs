// scripts/lint-stats.cjs
const fs = require('fs');

const path = 'lint-report.json';
if (!fs.existsSync(path)) {
  console.error(`File not found: ${path}. Run "npx eslint . -f json --output-file lint-report.json --no-warn-ignored" first.`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (e) {
  console.error('Failed to parse lint-report.json as JSON:', e.message);
  process.exit(1);
}

const byRule = {};
const byFile = {};

for (const f of report) {
  byFile[f.filePath] = (byFile[f.filePath] || 0) + (f.errorCount || 0);
  for (const m of f.messages) {
    const id = m.ruleId || '(no-rule-id)';
    byRule[id] = (byRule[id] || 0) + 1;
  }
}

const topRules = Object.entries(byRule).sort((a, b) => b[1] - a[1]).slice(0, 15);
const topFiles = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 20);

const totals = report.reduce(
  (acc, f) => {
    acc.errors += f.errorCount || 0;
    acc.warnings += f.warningCount || 0;
    return acc;
  },
  { errors: 0, warnings: 0 }
);

console.log('Totals:', totals);
console.log('\nTop rules (count):');
for (const [rule, count] of topRules) console.log(count.toString().padStart(6), rule);

console.log('\nWorst files (errors):');
for (const [file, count] of topFiles) console.log(count.toString().padStart(6), file);
