'use client';

import React from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import type { StepDef } from '@/types/schema';
import { useWizard } from './WizardProvider';
import { DeployButton } from './DeployButton';
import { DeployAllSecretsButton } from './DeployAllSecretsButton';
import { SecurityWarning } from './SecurityWarning';
import { OAuthInstructions } from './OAuthInstructions';
import { DevicePairing } from './DevicePairing';
import { SyncSecretButton } from './SyncSecretButton';
import { FieldRenderer } from '../fields/FieldRenderer';
import { checkStepCompletion } from '@/lib/completion-checker';
import { evaluateDependsOn } from '@/lib/depends-on-evaluator';

interface StepRendererProps {
  step: StepDef;
}

export function StepRenderer({ step }: StepRendererProps) {
  const { schema, state, dispatch, getFieldDef } = useWizard();

  // Get completion result for warnings
  const completionResult = checkStepCompletion(step, state, schema.fields);

  return (
    <div className="space-y-6">
      {/* Deploy Button */}
      {step.deploy_button && (
        <DeployButton config={step.deploy_button} />
      )}

      {/* Links (for signup, etc.) */}
      {step.links && step.links.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {step.links.map((linkRef) => {
            const link = schema.links[linkRef.ref];
            if (!link) return null;
            return (
              <a
                key={linkRef.ref}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <ExternalLink className="w-4 h-4" />
                {link.label}
              </a>
            );
          })}
        </div>
      )}

      {/* Checklist */}
      {step.checklist && step.checklist.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {step.deploy_button ? 'Follow these steps:' : 'Before you continue, make sure:'}
          </h4>
          <ul className="space-y-2">
            {step.checklist.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fields */}
      {step.fields && step.fields.length > 0 && (
        <div className="space-y-4">
          {step.fields.map((fieldId) => {
            const fieldDef = getFieldDef(fieldId);
            if (!fieldDef) return null;

            // Check if field should be visible based on depends_on
            if (fieldDef.depends_on && !evaluateDependsOn(fieldDef.depends_on, state)) {
              return null;
            }

            return <FieldRenderer key={fieldId} field={fieldDef} />;
          })}
        </div>
      )}

      {/* Sync Gateway Token to Cloudflare */}
      {step.id === 'gateway_token' && state.fields['moltbot_gateway_token']?.value && (
        <div className="mt-4">
          <SyncSecretButton
            secretName="MOLTBOT_GATEWAY_TOKEN"
            secretValue={state.fields['moltbot_gateway_token'].value as string}
          />
        </div>
      )}

      {/* Security mode warning - show after security_mode field is selected */}
      {step.id === 'cloudflare_access' && state.fields['security_mode']?.value && (
        <SecurityWarning mode={state.fields['security_mode'].value as string} />
      )}

      {/* OAuth instructions - show when OAuth token method is selected */}
      {step.id === 'llm_provider' && state.fields['anthropic_auth_method']?.value === 'setup_token' && (
        <OAuthInstructions />
      )}

      {/* Device Pairing - show on device_pairing step */}
      {step.id === 'device_pairing' && (
        <DevicePairing
          baseUrl={state.fields['base_url']?.value as string || ''}
          gatewayToken={state.fields['moltbot_gateway_token']?.value as string || ''}
          enabledChannels={(state.fields['enabled_channels']?.value as string[]) || []}
        />
      )}

      {/* Summary view */}
      {step.summary && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Configuration Summary
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
            {step.summary.show_fields.map((fieldId) => {
              const fieldDef = getFieldDef(fieldId);
              if (!fieldDef) return null;

              // Check visibility
              if (fieldDef.depends_on && !evaluateDependsOn(fieldDef.depends_on, state)) {
                return null;
              }

              const fieldState = state.fields[fieldId];
              const value = fieldState?.value;

              // Skip empty values
              if (!value || (Array.isArray(value) && value.length === 0)) {
                return null;
              }

              const displayValue = Array.isArray(value) ? value.join(', ') :
                fieldDef.type === 'secret' ? '••••••••' : value;

              return (
                <div key={fieldId} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {fieldDef.label}
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Deploy to Cloudflare */}
          <div className="mt-6 space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Deploy Configuration
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click the button below to deploy all your secrets to Cloudflare Workers.
            </p>
            <DeployAllSecretsButton state={state} />
          </div>
        </div>
      )}

      {/* Manual confirmation checkbox */}
      {step.completion.type === 'manual_confirm' && (
        <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <input
            type="checkbox"
            id={`confirm-${step.id}`}
            checked={state.stepConfirmations[step.id] ?? false}
            onChange={(e) => {
              dispatch({
                type: e.target.checked ? 'CONFIRM_STEP' : 'UNCONFIRM_STEP',
                stepId: step.id,
              });
            }}
            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label
            htmlFor={`confirm-${step.id}`}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {step.completion.label ?? 'I confirm'}
          </label>
        </div>
      )}

      {/* Warning message */}
      {completionResult.warning && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {completionResult.warning}
          </p>
        </div>
      )}
    </div>
  );
}
