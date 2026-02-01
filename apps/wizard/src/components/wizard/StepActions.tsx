'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Check, ExternalLink } from 'lucide-react';
import { useWizard } from './WizardProvider';

export function StepActions() {
  const { schema, state, dispatch, canProceed } = useWizard();

  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === schema.steps.length - 1;
  const canContinue = canProceed();

  const handleFinish = () => {
    const baseUrl = state.fields['base_url']?.value as string;
    const gatewayToken = state.fields['moltbot_gateway_token']?.value as string;
    if (baseUrl && gatewayToken) {
      const url = new URL(baseUrl);
      url.searchParams.set('token', gatewayToken);
      window.open(url.toString(), '_blank');
    }
  };

  const handlePrevious = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleNext = () => {
    if (canContinue) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={isFirstStep}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
          transition-colors
          ${isFirstStep
            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
        `}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      {/* Next/Finish Button */}
      {isLastStep ? (
        <button
          onClick={handleFinish}
          disabled={!canContinue}
          className={`
            inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${canContinue
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <ExternalLink className="w-4 h-4" />
          Go to Moltbot
        </button>
      ) : (
        <button
          onClick={handleNext}
          disabled={!canContinue}
          className={`
            inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${canContinue
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
