import type { OnboardingSchema, FieldDef } from '@/types/schema';

// Resolve options_from references to actual options (client-safe)
export function resolveOptionsFrom(
  field: FieldDef,
  schema: OnboardingSchema
): Array<{ id: string; label: string }> {
  if (!field.options_from) return field.options ?? [];

  // options_from format: "providers.llm" or "providers.channels"
  const parts = field.options_from.split('.');
  if (parts.length !== 2 || parts[0] !== 'providers') {
    console.warn(`Invalid options_from format: ${field.options_from}`);
    return field.options ?? [];
  }

  const providerKey = parts[1];
  const providers = schema.providers[providerKey] ?? [];
  return providers.map((p) => ({ id: p.id, label: p.label }));
}

// Get field definition by ID (client-safe)
export function getFieldById(
  schema: OnboardingSchema,
  fieldId: string
): FieldDef | undefined {
  return schema.fields.find((f) => f.id === fieldId);
}

// Get all fields for a step (client-safe)
export function getStepFields(
  schema: OnboardingSchema,
  stepId: string
): FieldDef[] {
  const step = schema.steps.find((s) => s.id === stepId);
  if (!step?.fields) return [];

  return step.fields
    .map((fieldId) => getFieldById(schema, fieldId))
    .filter((f): f is FieldDef => f !== undefined);
}

// Get link by ref (client-safe)
export function getLinkByRef(
  schema: OnboardingSchema,
  ref: string
): { label: string; url: string } | undefined {
  return schema.links[ref];
}
