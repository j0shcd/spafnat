#!/usr/bin/env tsx
/**
 * Preflight Check for Cloudflare Pages/Workers Deployment
 *
 * Validates codebase compatibility with Cloudflare Workers runtime before deployment.
 * Run before every commit to catch issues early.
 *
 * Checks:
 * 1. Node.js-only APIs that break Workers runtime
 * 2. Package manager consistency (npm only, no bun/yarn)
 * 3. Environment variable references match wrangler.toml bindings
 * 4. Hardcoded values that should use config
 * 5. Imports from packages not in dependencies
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

// ========== Configuration ==========

const NODE_ONLY_APIS = [
  // Process
  /\bprocess\.argv\b/,
  /\bprocess\.env\b(?!\.NODE_ENV)/, // Allow NODE_ENV for Vite
  /\bprocess\.cwd\b/,
  /\bprocess\.exit\b/,
  // File system
  /\brequire\(['"]fs['"]\)/,
  /\bimport.*from\s+['"]fs['"]/,
  /\brequire\(['"]path['"]\)/,
  /\bimport.*from\s+['"]path['"]/,
  /\brequire\(['"]os['"]\)/,
  // Relative requires (often Node.js patterns)
  /\brequire\(['"]\.\.?\//,
  // Buffer (use Uint8Array in Workers)
  /\bBuffer\.from\b/,
  /\bBuffer\.alloc\b/,
];

const ALLOWED_BINDINGS = [
  'SPAF_KV',        // KV namespace
  'SPAF_MEDIA',     // R2 bucket
  'JWT_SECRET',     // Environment variable
  'ADMIN_PASSWORD_HASH',
  'RESEND_API_KEY',
  'CONTACT_RECIPIENT',
];

const CONFIG_IMPORTS = [
  { pattern: /@\/config\/contact/, name: 'CONTACT_EMAIL' },
  { pattern: /@\/config\/documents/, name: 'DOCUMENTS' },
];

// Files/dirs to exclude from scanning
const EXCLUDE_PATHS = [
  'node_modules',
  'dist',
  '.git',
  'scripts', // Exclude scripts dir (can use Node.js APIs)
  'vite.config.ts', // Build config (runs in Node.js)
  'vitest.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'eslint.config.js',
];

// ========== Utility Functions ==========

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const relativePath = relative(ROOT, filePath);

    // Skip excluded paths
    if (EXCLUDE_PATHS.some((exclude) => relativePath.startsWith(exclude))) {
      return;
    }

    if (statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (
      file.endsWith('.ts') ||
      file.endsWith('.tsx') ||
      file.endsWith('.js') ||
      file.endsWith('.jsx')
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function readPackageJson(): { dependencies: Record<string, string>; devDependencies: Record<string, string> } {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  return {
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
  };
}

// ========== Validation Checks ==========

/**
 * Check 1: Scan for Node.js-only APIs
 */
function checkNodeAPIs(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const files = getAllFiles(join(ROOT, 'src')).concat(getAllFiles(join(ROOT, 'functions')));

  files.forEach((file) => {
    const content = readFileSync(file, 'utf-8');
    const relativePath = relative(ROOT, file);

    NODE_ONLY_APIS.forEach((pattern) => {
      if (pattern.test(content)) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (pattern.test(line)) {
            errors.push(
              `${relativePath}:${idx + 1} - Node.js-only API detected: ${line.trim()}`
            );
          }
        });
      }
    });
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 2: Verify npm lockfile exists (not bun/yarn)
 */
function checkPackageManager(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    readFileSync(join(ROOT, 'package-lock.json'), 'utf-8');
  } catch {
    errors.push('package-lock.json not found - project requires npm (not bun/yarn)');
  }

  // Warn if other lockfiles exist
  try {
    readFileSync(join(ROOT, 'bun.lockb'), 'utf-8');
    warnings.push('bun.lockb found - should use npm only');
  } catch {
    // OK
  }

  try {
    readFileSync(join(ROOT, 'yarn.lock'), 'utf-8');
    warnings.push('yarn.lock found - should use npm only');
  } catch {
    // OK
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 3: Verify env.* references match wrangler.toml bindings
 */
function checkEnvBindings(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const files = getAllFiles(join(ROOT, 'functions'));

  files.forEach((file) => {
    const content = readFileSync(file, 'utf-8');
    const relativePath = relative(ROOT, file);

    // Match env.BINDING_NAME
    const envPattern = /\benv\.([A-Z_]+)\b/g;
    let match;

    while ((match = envPattern.exec(content)) !== null) {
      const binding = match[1];
      if (!ALLOWED_BINDINGS.includes(binding)) {
        errors.push(
          `${relativePath} - Unknown binding 'env.${binding}' (not in wrangler.toml or env vars)`
        );
      }
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 4: Verify emails and endpoints use config values
 */
function checkHardcodedValues(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const files = getAllFiles(join(ROOT, 'src')).concat(getAllFiles(join(ROOT, 'functions')));

  // Email pattern - allow if line has comment marker or is in placeholder/from field
  const emailPattern = /['"]([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})['"]/;

  files.forEach((file) => {
    const relativePath = relative(ROOT, file);

    // Skip config files and test files
    if (
      relativePath.includes('config/') ||
      relativePath.includes('.test.') ||
      relativePath.includes('.spec.')
    ) {
      return;
    }

    const content = readFileSync(file, 'utf-8');

    // Check for hardcoded emails
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const emailMatch = line.match(emailPattern);
      if (emailMatch) {
        // Skip if:
        // - Line has comment indicating it's OK (// OK, // Domain verified, etc.)
        // - It's a placeholder attribute in HTML/JSX
        // - It's a 'from' field with verification comment nearby
        if (
          line.includes('// OK') ||
          line.includes('// Domain verified') ||
          line.includes('placeholder=') ||
          line.includes('from:') && (line.includes('✓') || line.includes('verified'))
        ) {
          return;
        }

        warnings.push(
          `${relativePath}:${idx + 1} - Hardcoded email '${emailMatch[1]}' (should use config/contact.ts or add '// OK' comment)`
        );
      }
    });
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 5: Verify all imports are in dependencies
 */
function checkMissingDependencies(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { dependencies, devDependencies } = readPackageJson();
  const allDeps = { ...dependencies, ...devDependencies };

  const files = getAllFiles(join(ROOT, 'src')).concat(getAllFiles(join(ROOT, 'functions')));

  files.forEach((file) => {
    const content = readFileSync(file, 'utf-8');
    const relativePath = relative(ROOT, file);

    // Match import/require statements
    const importPattern = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];

      // Skip relative imports, @/ alias, node built-ins
      if (
        importPath.startsWith('.') ||
        importPath.startsWith('@/') ||
        importPath.startsWith('node:')
      ) {
        continue;
      }

      // Extract package name (handle scoped packages)
      const pkgName = importPath.startsWith('@')
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0];

      if (!allDeps[pkgName]) {
        errors.push(
          `${relativePath} - Import '${importPath}' not found in package.json dependencies`
        );
      }
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// ========== Main ==========

function main() {
  console.log('🚀 Running preflight checks for Cloudflare Pages deployment...\n');

  const checks = [
    { name: '1. Node.js-only APIs', fn: checkNodeAPIs },
    { name: '2. Package Manager (npm)', fn: checkPackageManager },
    { name: '3. Environment Bindings', fn: checkEnvBindings },
    { name: '4. Hardcoded Values', fn: checkHardcodedValues },
    { name: '5. Missing Dependencies', fn: checkMissingDependencies },
  ];

  let allPassed = true;
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  checks.forEach(({ name, fn }) => {
    process.stdout.write(`${name}... `);
    const result = fn();

    if (result.passed && result.warnings.length === 0) {
      console.log('✅');
    } else if (result.passed) {
      console.log('⚠️');
    } else {
      console.log('❌');
      allPassed = false;
    }

    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  console.log('\n' + '='.repeat(80));

  if (allErrors.length > 0) {
    console.log('\n❌ ERRORS (must fix before commit):\n');
    allErrors.forEach((err) => console.log(`  ${err}`));
  }

  if (allWarnings.length > 0) {
    console.log('\n⚠️  WARNINGS (should fix):\n');
    allWarnings.forEach((warn) => console.log(`  ${warn}`));
  }

  if (allPassed && allWarnings.length === 0) {
    console.log('\n✅ All preflight checks passed!\n');
    process.exit(0);
  } else if (allPassed) {
    console.log('\n⚠️  Preflight checks passed with warnings.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Preflight checks failed. Fix errors before committing.\n');
    process.exit(1);
  }
}

main();
