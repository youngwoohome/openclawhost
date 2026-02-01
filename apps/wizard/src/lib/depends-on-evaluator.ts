import type { DependsOn } from '@/types/schema';
import type { WizardState } from '@/types/wizard';

/**
 * Evaluate whether a field's depends_on condition is satisfied.
 * Returns true if the field should be visible, false if it should be hidden.
 */
export function evaluateDependsOn(
  dependsOn: DependsOn | undefined,
  state: WizardState
): boolean {
  // No dependency means always visible
  if (!dependsOn) return true;

  const fieldValue = state.fields[dependsOn.field]?.value;

  // Handle "includes" for multiselect - check if array contains the value
  if (dependsOn.includes !== undefined) {
    if (!Array.isArray(fieldValue)) return false;
    return fieldValue.includes(dependsOn.includes);
  }

  // Handle "equals" for exact match
  if (dependsOn.equals !== undefined) {
    return fieldValue === dependsOn.equals;
  }

  // Default: check if field has any value (truthy check)
  if (Array.isArray(fieldValue)) {
    return fieldValue.length > 0;
  }
  return !!fieldValue;
}

/**
 * Check if a field is currently visible based on its depends_on condition.
 */
export function isFieldVisible(
  fieldId: string,
  dependsOn: DependsOn | undefined,
  state: WizardState
): boolean {
  return evaluateDependsOn(dependsOn, state);
}
