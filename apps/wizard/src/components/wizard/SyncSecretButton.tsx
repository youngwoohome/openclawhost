'use client';

import React, { useState } from 'react';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';

interface SyncSecretButtonProps {
  secretName: string;
  secretValue: string;
  disabled?: boolean;
}

type SyncState = 'idle' | 'loading' | 'success' | 'error';

export function SyncSecretButton({ secretName, secretValue, disabled }: SyncSecretButtonProps) {
  const [state, setState] = useState<SyncState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSync = async () => {
    setState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/deploy-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secretName,
          secretValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sync secret');
      }

      setState('success');
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setErrorMessage('');
  };

  if (state === 'success') {
    return (
      <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium">
          <Check className="w-5 h-5" />
          Synced to Cloudflare!
        </div>
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          Gateway token deployed. You can proceed to the next step.
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          <CloudOff className="w-4 h-4" />
          {errorMessage}
        </div>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary-600 hover:bg-primary-700 text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={disabled || state === 'loading'}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-colors
        ${disabled || state === 'loading'
          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          : 'bg-primary-600 hover:bg-primary-700 text-white'
        }
      `}
    >
      {state === 'loading' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <Cloud className="w-4 h-4" />
          Sync to Cloudflare
        </>
      )}
    </button>
  );
}
