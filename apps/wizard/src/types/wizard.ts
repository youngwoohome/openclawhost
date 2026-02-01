export interface ValidationResult {
  ok: boolean;
  message?: string;
  status?: number;
  evidence?: Record<string, unknown>;
}

export interface FieldState {
  value: string | string[];
  touched: boolean;
  validating: boolean;
  validationResult?: ValidationResult;
}

export interface WizardState {
  currentStepIndex: number;
  fields: Record<string, FieldState>;
  stepConfirmations: Record<string, boolean>;
}

export type WizardAction =
  | { type: 'SET_FIELD'; fieldId: string; value: string | string[] }
  | { type: 'START_VALIDATION'; fieldId: string }
  | { type: 'SET_VALIDATION_RESULT'; fieldId: string; result: ValidationResult }
  | { type: 'CONFIRM_STEP'; stepId: string }
  | { type: 'UNCONFIRM_STEP'; stepId: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; index: number }
  | { type: 'RESTORE_STATE'; state: WizardState };

export interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  schema: import('./schema').OnboardingSchema;
  getFieldDef: (fieldId: string) => import('./schema').FieldDef | undefined;
  getCurrentStep: () => import('./schema').StepDef;
  isStepComplete: (stepIndex: number) => boolean;
  canProceed: () => boolean;
}
