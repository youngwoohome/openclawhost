'use client';

import React from 'react';
import { useWizard } from './WizardProvider';
import { StepNavigation } from './StepNavigation';
import { StepRenderer } from './StepRenderer';
import { StepActions } from './StepActions';

export function WizardShell() {
  const { schema, state, getCurrentStep } = useWizard();
  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Moltworker Setup Wizard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure your Managed Moltworker instance
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <StepNavigation />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {/* Step Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Step {state.currentStepIndex + 1} of {schema.steps.length}
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {currentStep.title}
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {currentStep.description}
                </p>
              </div>

              {/* Step Content */}
              <div className="mb-8">
                <StepRenderer step={currentStep} />
              </div>

              {/* Step Actions (Next/Previous) */}
              <StepActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
