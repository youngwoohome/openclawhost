import type { StepDef, FieldDef } from '@/types/schema';
import type { WizardState } from '@/types/wizard';
import { evaluateDependsOn } from './depends-on-evaluator';

export interface CompletionResult {
  completed: boolean;
  warning?: string;
}

/**
 * Check if a step is complete based on its completion criteria.
 */
export function checkStepCompletion(
  step: StepDef,
  state: WizardState,
  allFields: FieldDef[]
): CompletionResult {
  const { completion } = step;

  switch (completion.type) {
    case 'always':
      return { completed: true };

    case 'manual_confirm':
      return { completed: state.stepConfirmations[step.id] ?? false };

    case 'validator_success': {
      // Find the action's input field and check its validation
      const action = step.actions?.find((a) => a.id === completion.validator);
      if (!action?.input_field) return { completed: false };
      const result = state.fields[action.input_field]?.validationResult;
      return { completed: result?.ok ?? false };
    }

    case 'fields_present': {
      const required = completion.required_fields ?? [];
      const allPresent = required.every((fieldId) => {
        const fieldDef = allFields.find((f) => f.id === fieldId);
        // If field has depends_on and it's not visible, skip it
        if (fieldDef?.depends_on && !evaluateDependsOn(fieldDef.depends_on, state)) {
          return true; // Hidden fields don't block completion
        }
        const val = state.fields[fieldId]?.value;
        return Array.isArray(val) ? val.length > 0 : !!val;
      });
      return { completed: allPresent };
    }

    case 'optional_any_of': {
      const anyOf = completion.any_of ?? [];
      const hasAny = anyOf.some((fieldId) => {
        const fieldDef = allFields.find((f) => f.id === fieldId);
        // If field has depends_on and it's not visible, it can't contribute
        if (fieldDef?.depends_on && !evaluateDependsOn(fieldDef.depends_on, state)) {
          return false;
        }
        const val = state.fields[fieldId]?.value;
        return Array.isArray(val) ? val.length > 0 : !!val;
      });

      if (!hasAny && completion.allow_none) {
        return { completed: true, warning: completion.none_warning };
      }
      return { completed: hasAny };
    }

    default:
      return { completed: false };
  }
}

/**
 * Get a human-readable description of what's needed to complete a step.
 */
export function getCompletionHint(step: StepDef): string {
  const { completion } = step;

  switch (completion.type) {
    case 'always':
      return 'This step is always complete.';
    case 'manual_confirm':
      return completion.label ?? 'Please confirm to continue.';
    case 'validator_success':
      return 'Validation must pass to continue.';
    case 'fields_present':
      return 'Fill in all required fields to continue.';
    case 'optional_any_of':
      if (completion.allow_none) {
        return 'Optionally configure one or more options, or skip.';
      }
      return 'Configure at least one option to continue.';
    default:
      return 'Complete this step to continue.';
  }
}
