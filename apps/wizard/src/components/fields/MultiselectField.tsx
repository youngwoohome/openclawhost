'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { FieldDef } from '@/types/schema';
import type { FieldState } from '@/types/wizard';
import { useWizard } from '../wizard/WizardProvider';

interface MultiselectFieldProps {
  field: FieldDef;
  state: FieldState;
  options: Array<{ id: string; label: string }>;
}

export function MultiselectField({ field, state, options }: MultiselectFieldProps) {
  const { dispatch } = useWizard();
  const selectedValues = (state.value as string[]) || [];

  const handleToggle = (optionId: string) => {
    const newValues = selectedValues.includes(optionId)
      ? selectedValues.filter((v) => v !== optionId)
      : [...selectedValues, optionId];

    dispatch({ type: 'SET_FIELD', fieldId: field.id, value: newValues });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleToggle(option.id)}
              className={`
                flex items-center gap-3 px-4 py-3 border rounded-lg text-left
                transition-colors
                ${isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {/* Checkbox indicator */}
              <div
                className={`
                  w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                  ${isSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300 dark:border-gray-500'
                  }
                `}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Label */}
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Help text */}
      {field.help && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{field.help}</p>
      )}

      {/* Selection summary */}
      {selectedValues.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selected: {selectedValues.map((v) => options.find((o) => o.id === v)?.label).join(', ')}
        </p>
      )}
    </div>
  );
}
