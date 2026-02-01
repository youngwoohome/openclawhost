'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface SecurityWarningProps {
  mode: 'dev_mode' | 'cloudflare_access' | string;
}

export function SecurityWarning({ mode }: SecurityWarningProps) {
  if (mode === 'dev_mode') {
    return (
      <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <ShieldAlert className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            Development Mode - No Authentication
          </h4>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            Your admin interface will be publicly accessible without login. This is fine for personal use
            or testing, but <strong>not recommended for production</strong>. You can configure Cloudflare Access later.
          </p>
          <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
            This will set <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">DEV_MODE=true</code> in your worker.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'cloudflare_access') {
    return (
      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
            Cloudflare Access - Secure Authentication
          </h4>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            Your admin interface will be protected by Cloudflare Access. Only authenticated users can access it.
          </p>
          <div className="mt-3 text-sm text-green-700 dark:text-green-300">
            <p className="font-medium">How to find your settings:</p>
            <ol className="mt-1 ml-4 list-decimal space-y-1 text-xs">
              <li>Go to <a href="https://one.dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="underline">Zero Trust Dashboard</a></li>
              <li>Navigate to <strong>Access → Applications</strong></li>
              <li>Create a new Self-hosted Application for your worker URL</li>
              <li>Copy the <strong>Application Audience (AUD) Tag</strong> from the Overview page</li>
              <li>Find your Team Domain in <strong>Settings → Custom Pages</strong></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
