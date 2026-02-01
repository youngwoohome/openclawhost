'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface OpenR2DashboardButtonProps {
  accountId?: string;
}

export function OpenR2DashboardButton({ accountId }: OpenR2DashboardButtonProps) {
  const handleOpenDashboard = () => {
    // If we have an account ID, construct the direct URL to R2 API tokens page
    // Otherwise, open the generic R2 overview page
    const url = accountId
      ? `https://dash.cloudflare.com/${accountId}/r2/api-tokens`
      : 'https://dash.cloudflare.com/?to=/:account/r2/api-tokens';

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleOpenDashboard}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
    >
      <ExternalLink className="w-4 h-4" />
      Open R2 Dashboard
    </button>
  );
}
