'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { OnboardingSchema, FieldDef, StepDef } from '@/types/schema';
import type { WizardState, WizardAction, WizardContextValue, ValidationResult } from '@/types/wizard';
import { checkStepCompletion } from '@/lib/completion-checker';

const STORAGE_KEY = 'moltworker-wizard-state';

function createInitialState(schema: OnboardingSchema): WizardState {
  const fields: Record<string, { value: string | string[]; touched: boolean; validating: boolean }> = {};

  for (const field of schema.fields) {
    fields[field.id] = {
      value: field.type === 'multiselect' ? [] : '',
      touched: false,
      validating: false,
    };
  }

  return {
    currentStepIndex: 0,
    fields,
    stepConfirmations: {},
  };
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.fieldId]: {
            ...state.fields[action.fieldId],
            value: action.value,
            touched: true,
          },
        },
      };

    case 'START_VALIDATION':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.fieldId]: {
            ...state.fields[action.fieldId],
            validating: true,
          },
        },
      };

    case 'SET_VALIDATION_RESULT':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.fieldId]: {
            ...state.fields[action.fieldId],
            validating: false,
            validationResult: action.result,
          },
        },
      };

    case 'CONFIRM_STEP':
      return {
        ...state,
        stepConfirmations: {
          ...state.stepConfirmations,
          [action.stepId]: true,
        },
      };

    case 'UNCONFIRM_STEP':
      return {
        ...state,
        stepConfirmations: {
          ...state.stepConfirmations,
          [action.stepId]: false,
        },
      };

    case 'NEXT_STEP':
      return {
        ...state,
        currentStepIndex: state.currentStepIndex + 1,
      };

    case 'PREV_STEP':
      return {
        ...state,
        currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      };

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStepIndex: action.index,
      };

    case 'RESTORE_STATE':
      return action.state;

    default:
      return state;
  }
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}

interface WizardProviderProps {
  schema: OnboardingSchema;
  children: React.ReactNode;
}

export function WizardProvider({ schema, children }: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, schema, createInitialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WizardState;
        // Validate the saved state has all required fields
        const currentFields = Object.keys(createInitialState(schema).fields);
        const savedFields = Object.keys(parsed.fields || {});
        const hasAllFields = currentFields.every((f) => savedFields.includes(f));

        if (hasAllFields) {
          dispatch({ type: 'RESTORE_STATE', state: parsed });
        }
      }
    } catch (err) {
      console.warn('Failed to restore wizard state:', err);
    }
  }, [schema]);

  // Save state to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save wizard state:', err);
    }
  }, [state]);

  const getFieldDef = useCallback(
    (fieldId: string): FieldDef | undefined => {
      return schema.fields.find((f) => f.id === fieldId);
    },
    [schema]
  );

  const getCurrentStep = useCallback((): StepDef => {
    return schema.steps[state.currentStepIndex];
  }, [schema, state.currentStepIndex]);

  const isStepComplete = useCallback(
    (stepIndex: number): boolean => {
      const step = schema.steps[stepIndex];
      if (!step) return false;
      const result = checkStepCompletion(step, state, schema.fields);
      return result.completed;
    },
    [schema, state]
  );

  const canProceed = useCallback((): boolean => {
    return isStepComplete(state.currentStepIndex);
  }, [isStepComplete, state.currentStepIndex]);

  const value: WizardContextValue = {
    state,
    dispatch,
    schema,
    getFieldDef,
    getCurrentStep,
    isStepComplete,
    canProceed,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
