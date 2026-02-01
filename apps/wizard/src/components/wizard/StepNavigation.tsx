'use client';

import React from 'react';
import { Check, Circle, CircleDot } from 'lucide-react';
import { useWizard } from './WizardProvider';

export function StepNavigation() {
  const { schema, state, dispatch, isStepComplete } = useWizard();

  return (
    <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Steps
      </h3>
      <ul className="space-y-2">
        {schema.steps.map((step, index) => {
          const isCurrent = index === state.currentStepIndex;
          const isComplete = isStepComplete(index);
          const isPast = index < state.currentStepIndex;
          const canNavigate = isPast || (index === state.currentStepIndex);

          return (
            <li key={step.id}>
              <button
                onClick={() => canNavigate && dispatch({ type: 'GO_TO_STEP', index })}
                disabled={!canNavigate}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors
                  ${isCurrent
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${!canNavigate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Status Icon */}
                <span className="flex-shrink-0">
                  {isComplete ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : isCurrent ? (
                    <CircleDot className="w-5 h-5 text-primary-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  )}
                </span>

                {/* Step Title */}
                <span
                  className={`
                    text-sm font-medium
                    ${isCurrent
                      ? 'text-primary-700 dark:text-primary-300'
                      : isComplete
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
