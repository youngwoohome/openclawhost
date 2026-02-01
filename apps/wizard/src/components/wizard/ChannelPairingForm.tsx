'use client';

import React, { useState } from 'react';
import { MessageCircle, CheckCircle, XCircle, Loader } from 'lucide-react';

interface ChannelPairingFormProps {
  baseUrl: string;
  gatewayToken: string;
  enabledChannels: string[];
}

const CHANNEL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
};

export function ChannelPairingForm({ baseUrl, gatewayToken, enabledChannels }: ChannelPairingFormProps) {
  const [selectedChannel, setSelectedChannel] = useState(enabledChannels.length === 1 ? enabledChannels[0] : '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Don't render if no channels are enabled
  if (enabledChannels.length === 0) {
    return null;
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    setCode(value);
    setError(null);
    setSuccess(false);
  };

  const handlePair = async () => {
    if (!selectedChannel || !code.trim()) {
      setError('Please select a channel and enter a pairing code');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/channel-pairing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_url: baseUrl,
          gateway_token: gatewayToken,
          channel: selectedChannel,
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (data.ok && data.success) {
        setSuccess(true);
        setCode('');
      } else {
        setError(data.error || 'Failed to pair channel');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pair channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Banner */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-700 dark:text-green-300">
                Channel paired successfully!
              </p>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Channel Selection */}
      <div>
        <label htmlFor="channel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Channel
        </label>
        <div className="relative">
          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            id="channel"
            value={selectedChannel}
            onChange={(e) => {
              setSelectedChannel(e.target.value);
              setError(null);
              setSuccess(false);
            }}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {enabledChannels.length > 1 && (
              <option value="">Select a channel...</option>
            )}
            {enabledChannels.map((channel) => (
              <option key={channel} value={channel}>
                {CHANNEL_LABELS[channel] || channel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Code Input */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pairing Code
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={handleCodeChange}
          placeholder="Enter pairing code"
          maxLength={16}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Alphanumeric only, max 16 characters
        </p>
      </div>

      {/* Pair Button */}
      <button
        onClick={handlePair}
        disabled={loading || !selectedChannel || !code.trim()}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Pairing...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Pair Channel
          </>
        )}
      </button>
    </div>
  );
}
