import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalViolations = 0;

function logHeader(title) {
  console.log(`\n================================================================`);
  console.log(`  ${title}`);
  console.log(`================================================================\n`);
}

function scanDirectory(dirPath, fileExtension = /\.(ts|tsx)$/) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && fileExtension.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(dirPath);
  return results;
}

function checkRules() {
  logHeader('DESHAL ERP — AUTOMATED CLEAN ARCHITECTURE AUDIT');

  // --- RULE 1: DOMAIN PURITY ---
  console.log('--- 1. DOMAIN LAYER PURITY AUDIT ---');
  const domainFiles = scanDirectory(path.join(rootDir, 'src', 'domain'));
  let domainViolations = 0;

  const forbiddenDomainImportRegex = /from\s+['"].*(components|contexts|hooks|lib|utils|supabase|react)/i;
  const forbiddenDomainGlobalRegex = /(localStorage|sessionStorage|window\.|document\.|navigator\.|fetch\(|supabase|Math\.random)/;

  for (const filePath of domainFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(rootDir, filePath);

    lines.forEach((line, idx) => {
      if (forbiddenDomainImportRegex.test(line)) {
        console.error(`  ❌ DOMAIN IMPORT LEAK [${relativePath}:${idx + 1}]: ${line.trim()}`);
        domainViolations++;
      }
      if (forbiddenDomainGlobalRegex.test(line)) {
        console.error(`  ❌ DOMAIN BROWSER/INFRA LEAK [${relativePath}:${idx + 1}]: ${line.trim()}`);
        domainViolations++;
      }
    });
  }

  if (domainViolations === 0) {
    console.log('  ✅ PASS: Domain layer is 100% pure (0 leaks found across ' + domainFiles.length + ' files)');
  }
  totalViolations += domainViolations;

  // --- RULE 2: APPLICATION PURITY ---
  console.log('\n--- 2. APPLICATION LAYER PURITY AUDIT ---');
  const appFiles = scanDirectory(path.join(rootDir, 'src', 'application'));
  let appViolations = 0;

  const forbiddenAppImportRegex = /from\s+['"].*(lib|components|contexts|hooks|utils|supabase)/i;
  const forbiddenAppGlobalRegex = /(localStorage|sessionStorage|window\.|document\.|navigator\.|fetch\(|supabase)/;
  const forbiddenAdapterImportRegex = /from\s+['"].*lib\/adapters/i;

  for (const filePath of appFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(rootDir, filePath);

    lines.forEach((line, idx) => {
      if (forbiddenAppImportRegex.test(line)) {
        console.error(`  ❌ APPLICATION IMPORT LEAK [${relativePath}:${idx + 1}]: ${line.trim()}`);
        appViolations++;
      }
      if (forbiddenAppGlobalRegex.test(line)) {
        console.error(`  ❌ APPLICATION BROWSER/STORAGE LEAK [${relativePath}:${idx + 1}]: ${line.trim()}`);
        appViolations++;
      }
      if (forbiddenAdapterImportRegex.test(line)) {
        console.error(`  ❌ APPLICATION CONCRETE ADAPTER LEAK [${relativePath}:${idx + 1}]: ${line.trim()}`);
        appViolations++;
      }
    });
  }

  if (appViolations === 0) {
    console.log('  ✅ PASS: Application layer is 100% pure (0 leaks found across ' + appFiles.length + ' files)');
  }
  totalViolations += appViolations;

  // --- RULE 3: APPLICATION PORTS OWNERSHIP ---
  console.log('\n--- 3. APPLICATION PORTS CONTRACT AUDIT ---');
  const portFiles = scanDirectory(path.join(rootDir, 'src', 'application', 'ports'));
  let portViolations = 0;

  const forbiddenPortImportRegex = /from\s+['"].*(lib|utils|components|contexts|hooks|supabase)/i;

  for (const filePath of portFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(rootDir, filePath);

    lines.forEach((line, idx) => {
      if (forbiddenPortImportRegex.test(line)) {
        console.error(`  ❌ PORT CONTRACT LEAK [${relativePath}:${idx + 1}]: ${line.trim()}`);
        portViolations++;
      }
    });
  }

  if (portViolations === 0) {
    console.log('  ✅ PASS: Application ports are 100% abstract (0 leaks found across ' + portFiles.length + ' files)');
  }
  totalViolations += portViolations;

  // --- SUMMARY ---
  console.log('\n================================================================');
  if (totalViolations === 0) {
    console.log('  🎉 RESULTS: 100/100 CLEAN ARCHITECTURE AUDIT PASSED');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error(`  ❌ RESULTS: ${totalViolations} ARCHITECTURAL VIOLATIONS FOUND`);
    console.log('================================================================\n');
    process.exit(1);
  }
}

checkRules();
