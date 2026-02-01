'use client';

import React from 'react';
import { Terminal, Sparkles } from 'lucide-react';
import { CopyButton } from '../fields/CopyButton';

export function OAuthInstructions() {
  const command = 'claude setup-token';

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            Free for Claude Pro/Max Subscribers!
          </h4>
          <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
            If you have Claude Pro or Claude Max subscription, you can use your setup token instead of paying for API usage.
          </p>

          <div className="mt-3">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
              Get your token by running this command in your terminal:
            </p>
            <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
              <Terminal className="w-4 h-4 text-gray-400" />
              <code className="flex-1 text-sm text-green-400 font-mono">{command}</code>
              <CopyButton text={command} />
            </div>
          </div>

          <p className="mt-3 text-xs text-purple-600 dark:text-purple-400">
            Note: You need the Claude CLI installed. If you don't have it, get it from{' '}
            <a
              href="https://docs.anthropic.com/en/docs/claude-code/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-purple-800 dark:hover:text-purple-200"
            >
              Anthropic's docs
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
