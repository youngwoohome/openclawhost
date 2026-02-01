'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { FieldDef } from '@/types/schema';
import type { FieldState } from '@/types/wizard';
import { useWizard } from '../wizard/WizardProvider';

interface SelectFieldProps {
  field: FieldDef;
  state: FieldState;
  options: Array<{ id: string; label: string }>;
}

export function SelectField({ field, state, options }: SelectFieldProps) {
  const { dispatch } = useWizard();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_FIELD', fieldId: field.id, value: e.target.value });
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <select
          id={field.id}
          value={state.value as string}
          onChange={handleChange}
          className="
            block w-full pl-3 pr-10 py-2 border rounded-lg
            text-gray-900 dark:text-white
            bg-white dark:bg-gray-700
            border-gray-300 dark:border-gray-600
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            appearance-none cursor-pointer
          "
        >
          <option value="">Select an option...</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Help text */}
      {field.help && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{field.help}</p>
      )}
    </div>
  );
}
