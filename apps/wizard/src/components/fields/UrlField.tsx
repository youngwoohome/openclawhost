'use client';

import React, { useState } from 'react';
import { Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { FieldDef } from '@/types/schema';
import type { FieldState } from '@/types/wizard';
import { useWizard } from '../wizard/WizardProvider';

interface UrlFieldProps {
  field: FieldDef;
  state: FieldState;
}

export function UrlField({ field, state }: UrlFieldProps) {
  const { dispatch } = useWizard();
  const [localValue, setLocalValue] = useState(state.value as string);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    dispatch({ type: 'SET_FIELD', fieldId: field.id, value });
  };

  const handleValidate = async () => {
    const value = state.value as string;
    if (!value) return;

    dispatch({ type: 'START_VALIDATION', fieldId: field.id });

    try {
      const response = await fetch('/api/validate_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: value }),
      });

      const result = await response.json();
      dispatch({ type: 'SET_VALIDATION_RESULT', fieldId: field.id, result });
    } catch (error) {
      dispatch({
        type: 'SET_VALIDATION_RESULT',
        fieldId: field.id,
        result: { ok: false, message: 'Validation request failed' },
      });
    }
  };

  const validationResult = state.validationResult;

  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="url"
            id={field.id}
            value={localValue}
            onChange={handleChange}
            placeholder="https://example.workers.dev"
            className={`
              block w-full pl-10 pr-10 py-2 border rounded-lg
              text-gray-900 dark:text-white
              bg-white dark:bg-gray-700
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              ${validationResult?.ok === true
                ? 'border-green-500'
                : validationResult?.ok === false
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }
            `}
          />
          {/* Status icon */}
          {state.validating ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            </div>
          ) : validationResult?.ok === true ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          ) : validationResult?.ok === false ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          ) : null}
        </div>

        {/* Validate button */}
        <button
          type="button"
          onClick={handleValidate}
          disabled={!state.value || state.validating}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${!state.value || state.validating
              ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
            }
          `}
        >
          {state.validating ? 'Checking...' : 'Validate'}
        </button>
      </div>

      {/* Help text */}
      {field.help && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{field.help}</p>
      )}

      {/* Validation message */}
      {validationResult?.message && (
        <p
          className={`text-sm ${
            validationResult.ok
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {validationResult.message}
        </p>
      )}
    </div>
  );
}
