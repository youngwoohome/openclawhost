'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { FieldDef } from '@/types/schema';
import type { FieldState } from '@/types/wizard';
import { useWizard } from '../wizard/WizardProvider';
import { CopyButton } from './CopyButton';
import { GenerateSecretButton } from './GenerateSecretButton';
import { DetectAccountIdButton } from './DetectAccountIdButton';
import { OpenR2DashboardButton } from './OpenR2DashboardButton';

interface SecretFieldProps {
  field: FieldDef;
  state: FieldState;
}

export function SecretField({ field, state }: SecretFieldProps) {
  const { dispatch, state: wizardState } = useWizard();
  const [showSecret, setShowSecret] = useState(false);
  const [localValue, setLocalValue] = useState(state.value as string);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    dispatch({ type: 'SET_FIELD', fieldId: field.id, value });
  };

  const handleGenerate = (secret: string) => {
    setLocalValue(secret);
    dispatch({ type: 'SET_FIELD', fieldId: field.id, value: secret });
  };

  const handleValidate = async () => {
    const value = state.value as string;
    if (!value) return;

    // Determine which validator to use based on field ID
    let endpoint = '';
    let body: Record<string, string> = {};

    if (field.id === 'slack_bot_token') {
      endpoint = '/api/validate_slack_bot_token';
      body = { token: value };
    } else if (field.id === 'telegram_bot_token') {
      endpoint = '/api/validate_telegram_bot_token';
      body = { token: value };
    } else if (field.id === 'discord_bot_token') {
      endpoint = '/api/validate_discord_bot_token';
      body = { token: value };
    } else {
      // No validator for this field
      return;
    }

    dispatch({ type: 'START_VALIDATION', fieldId: field.id });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
  const hasValidator = ['slack_bot_token', 'telegram_bot_token', 'discord_bot_token'].includes(field.id);
  const isR2Field = ['r2_access_key_id', 'r2_secret_access_key', 'cf_account_id'].includes(field.id);
  const isAccountIdField = field.id === 'cf_account_id';

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
          <input
            type={showSecret ? 'text' : 'password'}
            id={field.id}
            value={localValue}
            onChange={handleChange}
            placeholder="••••••••"
            className={`
              block w-full pl-3 pr-20 py-2 border rounded-lg
              text-gray-900 dark:text-white font-mono
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

          {/* Action buttons inside input */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
            {/* Validation status */}
            {state.validating ? (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            ) : validationResult?.ok === true ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : validationResult?.ok === false ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : null}

            {/* Show/hide toggle */}
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showSecret ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>

            {/* Copy button */}
            {localValue && <CopyButton text={localValue} />}
          </div>
        </div>

        {/* Generate button */}
        {field.generate && (
          <GenerateSecretButton
            length={field.generate.length}
            onGenerate={handleGenerate}
          />
        )}

        {/* Validate button for token fields */}
        {hasValidator && (
          <button
            type="button"
            onClick={handleValidate}
            disabled={!state.value || state.validating}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
              transition-colors
              ${!state.value || state.validating
                ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
              }
            `}
          >
            {state.validating ? 'Checking...' : 'Validate'}
          </button>
        )}
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

      {/* R2 Helper Buttons */}
      {isR2Field && (
        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {isAccountIdField ? 'Quick Setup' : 'Need R2 Credentials?'}
          </p>

          {isAccountIdField ? (
            <>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Click the button below to automatically detect your Cloudflare Account ID using wrangler.
              </p>
              <DetectAccountIdButton
                onDetected={(accountId) => {
                  setLocalValue(accountId);
                  dispatch({ type: 'SET_FIELD', fieldId: field.id, value: accountId });
                }}
              />
            </>
          ) : (
            <>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Click the button below to open the Cloudflare R2 dashboard where you can create an API token.
              </p>
              <div className="space-y-2">
                <OpenR2DashboardButton
                  accountId={wizardState.fields?.['cf_account_id']?.value as string}
                />
                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <p className="font-medium">In the R2 dashboard:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Click "Create API Token"</li>
                    <li>Select "Object Read & Write" permissions</li>
                    <li>Choose the "moltbot-data" bucket</li>
                    <li>Copy the Access Key ID and Secret Access Key</li>
                    <li>Paste them into the fields above</li>
                  </ol>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
