'use client';

import React, { useState } from 'react';
import { Wand2, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface DetectAccountIdButtonProps {
  onDetected: (accountId: string, accountName?: string) => void;
  disabled?: boolean;
}

export function DetectAccountIdButton({ onDetected, disabled }: DetectAccountIdButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleDetect = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/get-account-id');
      const data = await response.json();

      if (data.ok && data.accountId) {
        setStatus('success');
        setMessage(`Detected: ${data.accountName || data.accountId}`);
        onDetected(data.accountId, data.accountName);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to detect account ID');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDetect}
        disabled={disabled || loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Detecting...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Auto-Detect Account ID
          </>
        )}
      </button>

      {status !== 'idle' && message && (
        <div
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
            status === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
