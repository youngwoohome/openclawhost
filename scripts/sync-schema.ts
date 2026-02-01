#!/usr/bin/env tsx
/**
 * sync-schema.ts
 *
 * CLI tool to sync onboarding.schema.yaml with the moltworker codebase.
 * Scans for environment variables in:
 * - moltworker/README.md
 * - moltworker/src/**\/*.{ts,tsx}
 *
 * Usage: pnpm sync-schema
 */

import { parse, stringify } from 'yaml';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

interface FieldDef {
  id: string;
  label: string;
  type: string;
  required: boolean;
  help?: string;
  validators?: string[];
  depends_on?: unknown;
  generate?: unknown;
  options?: unknown[];
  options_from?: string;
  deprecated?: boolean;
}

interface OnboardingSchema {
  version: number;
  metadata: {
    product: string;
    source_repo: string;
    notes: string[];
  };
  links: Record<string, unknown>;
  providers: Record<string, unknown[]>;
  validators: unknown[];
  fields: FieldDef[];
  steps: unknown[];
}

interface SyncReport {
  new: string[];
  deprecated: string[];
  unchanged: string[];
  timestamp: string;
}

/**
 * Extract environment variable names from README.md
 */
function extractEnvVarsFromReadme(content: string): Set<string> {
  const vars = new Set<string>();

  // Match patterns like `MOLTBOT_GATEWAY_TOKEN` in code blocks or backticks
  const backtickMatches = content.matchAll(/`([A-Z][A-Z0-9_]+)`/g);
  for (const match of backtickMatches) {
    vars.add(match[1]);
  }

  // Match patterns in tables: | VARIABLE_NAME |
  const tableMatches = content.matchAll(/\|\s*([A-Z][A-Z0-9_]+)\s*\|/g);
  for (const match of tableMatches) {
    vars.add(match[1]);
  }

  return vars;
}

/**
 * Extract environment variables from source code
 */
function extractEnvVarsFromCode(content: string): Set<string> {
  const vars = new Set<string>();

  // Match process.env.VAR_NAME
  const processEnvMatches = content.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g);
  for (const match of processEnvMatches) {
    vars.add(match[1]);
  }

  // Match c.env.VAR_NAME (Hono context)
  const cEnvMatches = content.matchAll(/c\.env\.([A-Z][A-Z0-9_]+)/g);
  for (const match of cEnvMatches) {
    vars.add(match[1]);
  }

  // Match env.VAR_NAME (destructured)
  const envMatches = content.matchAll(/\benv\.([A-Z][A-Z0-9_]+)/g);
  for (const match of envMatches) {
    vars.add(match[1]);
  }

  return vars;
}

/**
 * Convert environment variable name to field ID
 */
function envToFieldId(envName: string): string {
  return envName.toLowerCase();
}

/**
 * Convert field ID to environment variable name
 */
function fieldIdToEnv(fieldId: string): string {
  return fieldId.toUpperCase();
}

/**
 * Determine field type based on variable name
 */
function inferFieldType(envName: string): string {
  const name = envName.toUpperCase();

  if (name.includes('URL') || name.includes('ENDPOINT')) {
    return 'url';
  }

  if (
    name.includes('TOKEN') ||
    name.includes('KEY') ||
    name.includes('SECRET') ||
    name.includes('PASSWORD')
  ) {
    return 'secret';
  }

  return 'secret'; // Default to secret for safety
}

/**
 * Generate diff markdown report
 */
function generateDiffMarkdown(report: SyncReport): string {
  return `# Schema Sync Report

Generated: ${report.timestamp}

## New Variables (added to schema)
${report.new.length > 0 ? report.new.map((v) => `- \`${v}\``).join('\n') : '_None_'}

## Deprecated Variables (marked in schema)
${report.deprecated.length > 0 ? report.deprecated.map((v) => `- \`${v}\``).join('\n') : '_None_'}

## Unchanged Variables
${report.unchanged.length > 0 ? report.unchanged.map((v) => `- \`${v}\``).join('\n') : '_None_'}

---

To apply changes, review the updated \`onboarding.schema.yaml\` file.
`;
}

async function main() {
  const rootDir = process.cwd();
  const moltworkerDir = path.join(rootDir, 'moltworker');
  const schemaPath = path.join(rootDir, 'onboarding.schema.yaml');

  console.log('🔍 Scanning moltworker codebase for environment variables...\n');

  // 1. Check if moltworker directory exists
  if (!existsSync(moltworkerDir)) {
    console.error('❌ Error: moltworker directory not found at', moltworkerDir);
    process.exit(1);
  }

  // 2. Parse README for env vars
  const readmePath = path.join(moltworkerDir, 'README.md');
  let readmeVars = new Set<string>();
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, 'utf-8');
    readmeVars = extractEnvVarsFromReadme(readme);
    console.log(`📄 Found ${readmeVars.size} variables in README.md`);
  } else {
    console.log('⚠️  README.md not found, skipping');
  }

  // 3. Scan source code for env vars
  const sourceFiles = await glob(path.join(moltworkerDir, 'src/**/*.{ts,tsx}'));
  const codeVars = new Set<string>();

  for (const file of sourceFiles) {
    const content = readFileSync(file, 'utf-8');
    const fileVars = extractEnvVarsFromCode(content);
    for (const v of fileVars) {
      codeVars.add(v);
    }
  }

  console.log(`📁 Found ${codeVars.size} variables in ${sourceFiles.length} source files`);

  // 4. Merge all found variables
  const allFoundVars = new Set([...readmeVars, ...codeVars]);

  // Filter out non-config variables (internal Cloudflare vars, etc.)
  const ignoredPrefixes = ['CF_', 'WRANGLER_', 'NODE_', 'npm_'];
  const ignoredVars = ['VERSION', 'DEBUG', 'DEBUG_ROUTES', 'DEV_MODE'];

  const filteredVars = new Set(
    [...allFoundVars].filter((v) => {
      if (ignoredVars.includes(v)) return false;
      for (const prefix of ignoredPrefixes) {
        if (v.startsWith(prefix) && !v.startsWith('CF_ACCESS_')) return false;
      }
      return true;
    })
  );

  console.log(`\n🔧 ${filteredVars.size} configuration variables identified\n`);

  // 5. Load current schema
  if (!existsSync(schemaPath)) {
    console.error('❌ Error: onboarding.schema.yaml not found at', schemaPath);
    process.exit(1);
  }

  const schemaContent = readFileSync(schemaPath, 'utf-8');
  const schema = parse(schemaContent) as OnboardingSchema;

  // Get current schema vars (by field ID converted to env name)
  const schemaVars = new Set(schema.fields.map((f) => fieldIdToEnv(f.id)));

  // 6. Compute diff
  const report: SyncReport = {
    new: [...filteredVars].filter((v) => !schemaVars.has(v)),
    deprecated: [...schemaVars].filter((v) => !filteredVars.has(v)),
    unchanged: [...schemaVars].filter((v) => filteredVars.has(v)),
    timestamp: new Date().toISOString(),
  };

  console.log('📊 Sync Report:');
  console.log(`   ✅ Unchanged: ${report.unchanged.length}`);
  console.log(`   ➕ New: ${report.new.length}`);
  console.log(`   ⚠️  Deprecated: ${report.deprecated.length}`);
  console.log('');

  // 7. Update schema with new variables
  if (report.new.length > 0) {
    console.log('Adding new variables to schema:');
    for (const envName of report.new) {
      const fieldId = envToFieldId(envName);
      const fieldType = inferFieldType(envName);

      const newField: FieldDef = {
        id: fieldId,
        label: envName,
        type: fieldType,
        required: false,
        help: `TODO: Add description for ${envName}`,
        validators: ['required_nonempty'],
      };

      schema.fields.push(newField);
      console.log(`   + ${envName} (${fieldType})`);
    }
  }

  // 8. Mark deprecated fields
  if (report.deprecated.length > 0) {
    console.log('\nMarking deprecated variables:');
    for (const envName of report.deprecated) {
      const fieldId = envToFieldId(envName);
      const field = schema.fields.find((f) => f.id === fieldId);
      if (field) {
        field.deprecated = true;
        console.log(`   - ${envName}`);
      }
    }
  }

  // 9. Write updated schema
  writeFileSync(schemaPath, stringify(schema, { lineWidth: 0 }));
  console.log(`\n✅ Updated ${schemaPath}`);

  // 10. Write report files
  const reportDir = rootDir;
  writeFileSync(
    path.join(reportDir, 'schema.report.json'),
    JSON.stringify(report, null, 2)
  );
  writeFileSync(
    path.join(reportDir, 'schema.diff.md'),
    generateDiffMarkdown(report)
  );

  console.log(`📝 Generated schema.report.json and schema.diff.md`);
  console.log('\n🎉 Schema sync complete!');

  if (report.new.length > 0) {
    console.log('\n⚠️  Note: New fields have been added with placeholder descriptions.');
    console.log('   Please review onboarding.schema.yaml and update the help text.');
  }
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
