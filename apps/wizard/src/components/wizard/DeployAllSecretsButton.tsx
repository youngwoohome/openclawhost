'use client';

import React, { useState } from 'react';
import { Cloud, Loader2, Check, AlertCircle } from 'lucide-react';
import type { WizardState } from '@/types/wizard';

interface DeployAllSecretsButtonProps {
  state: WizardState;
}

interface SecretMapping {
  fieldId: string;
  secretName: string;
  condition?: (state: WizardState) => boolean;
  getValue?: (state: WizardState) => string;
}

const SECRET_MAPPINGS: SecretMapping[] = [
  // Gateway Token - required for all API access
  {
    fieldId: 'moltbot_gateway_token',
    secretName: 'MOLTBOT_GATEWAY_TOKEN',
  },
  // Anthropic OAuth Token (for Claude Pro/Max subscribers)
  {
    fieldId: 'anthropic_setup_token',
    secretName: 'ANTHROPIC_OAUTH_TOKEN',
    condition: (s) => s.fields['anthropic_auth_method']?.value === 'setup_token',
  },
  // Anthropic API Key
  {
    fieldId: 'anthropic_api_key',
    secretName: 'ANTHROPIC_API_KEY',
    condition: (s) => s.fields['anthropic_auth_method']?.value === 'api_key',
  },
  // Telegram
  { fieldId: 'telegram_bot_token', secretName: 'TELEGRAM_BOT_TOKEN' },
  // Discord
  { fieldId: 'discord_bot_token', secretName: 'DISCORD_BOT_TOKEN' },
  // Slack
  { fieldId: 'slack_bot_token', secretName: 'SLACK_BOT_TOKEN' },
  { fieldId: 'slack_app_token', secretName: 'SLACK_APP_TOKEN' },
];

type DeployState = 'idle' | 'deploying' | 'success' | 'error';

interface DeployError {
  secretName: string;
  error: string;
}

export function DeployAllSecretsButton({ state }: DeployAllSecretsButtonProps) {
  const [deployState, setDeployState] = useState<DeployState>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<DeployError[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const getSecretsToDepoy = (): Array<{ secretName: string; value: string }> => {
    const secrets: Array<{ secretName: string; value: string }> = [];

    for (const mapping of SECRET_MAPPINGS) {
      // Check condition if it exists
      if (mapping.condition && !mapping.condition(state)) {
        continue;
      }

      // Get the value
      const fieldState = state.fields[mapping.fieldId];
      if (!fieldState) continue;

      const value = mapping.getValue
        ? mapping.getValue(state)
        : typeof fieldState.value === 'string'
          ? fieldState.value
          : '';

      // Skip if no value
      if (!value || value.trim() === '') {
        continue;
      }

      secrets.push({
        secretName: mapping.secretName,
        value,
      });
    }

    return secrets;
  };

  const handleDeployAll = async () => {
    const secretsToDeploy = getSecretsToDepoy();

    if (secretsToDeploy.length === 0) {
      return;
    }

    setDeployState('deploying');
    setProgress({ current: 0, total: secretsToDeploy.length });
    setErrors([]);
    setSuccessCount(0);

    const deployErrors: DeployError[] = [];
    let successfulDeployments = 0;

    for (let i = 0; i < secretsToDeploy.length; i++) {
      const { secretName, value } = secretsToDeploy[i];
      setProgress({ current: i + 1, total: secretsToDeploy.length });

      try {
        const response = await fetch('/api/deploy-secret', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            secretName,
            secretValue: value,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to deploy secret');
        }

        successfulDeployments++;
      } catch (error) {
        deployErrors.push({
          secretName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setSuccessCount(successfulDeployments);
    setErrors(deployErrors);

    if (deployErrors.length === 0) {
      setDeployState('success');
    } else {
      setDeployState('error');
    }
  };

  const handleRetry = () => {
    setDeployState('idle');
    setErrors([]);
    setProgress({ current: 0, total: 0 });
    setSuccessCount(0);
  };

  const secretsToDeploy = getSecretsToDepoy();
  const hasSecrets = secretsToDeploy.length > 0;

  if (deployState === 'success') {
    return (
      <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium">
          <Check className="w-5 h-5" />
          All {successCount} secrets deployed to Cloudflare!
        </div>
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          All secrets have been successfully deployed. You can proceed to the next step.
        </p>
      </div>
    );
  }

  if (deployState === 'error') {
    return (
      <div className="space-y-3">
        {successCount > 0 && (
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
              <Check className="w-4 h-4" />
              {successCount} secret{successCount !== 1 ? 's' : ''} deployed successfully
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium mb-2">
            <AlertCircle className="w-4 h-4" />
            {errors.length} secret{errors.length !== 1 ? 's' : ''} failed to deploy
          </div>
          <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
            {errors.map((err, idx) => (
              <li key={idx}>
                <strong>{err.secretName}:</strong> {err.error}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary-600 hover:bg-primary-700 text-white transition-colors"
        >
          Retry Failed Secrets
        </button>
      </div>
    );
  }

  if (deployState === 'deploying') {
    return (
      <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
          <Loader2 className="w-5 h-5 animate-spin" />
          Deploying {progress.current}/{progress.total} secrets...
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleDeployAll}
      disabled={!hasSecrets}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-colors
        ${
          !hasSecrets
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        }
      `}
    >
      <Cloud className="w-4 h-4" />
      Deploy {secretsToDeploy.length} Secret{secretsToDeploy.length !== 1 ? 's' : ''} to Cloudflare
    </button>
  );
}
