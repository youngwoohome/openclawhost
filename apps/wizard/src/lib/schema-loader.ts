import { parse } from 'yaml';
import { readFileSync } from 'fs';
import path from 'path';
import type { OnboardingSchema } from '@/types/schema';

// Server-side only: Load and parse YAML at build/request time
// This file should only be imported from server components or API routes
export function loadSchema(): OnboardingSchema {
  const schemaPath = path.join(process.cwd(), '../../onboarding.schema.yaml');
  const yamlContent = readFileSync(schemaPath, 'utf-8');
  return parse(yamlContent) as OnboardingSchema;
}
