'use client';

import React from 'react';
import { Rocket } from 'lucide-react';
import type { DeployButton as DeployButtonType } from '@/types/schema';

interface DeployButtonProps {
  config: DeployButtonType;
}

export function DeployButton({ config }: DeployButtonProps) {
  return (
    <div className="my-6">
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-flex items-center gap-3 px-8 py-4
          bg-orange-500 hover:bg-orange-600
          text-white font-semibold text-lg
          rounded-xl shadow-lg hover:shadow-xl
          transition-all duration-200
          transform hover:scale-105
        "
      >
        <Rocket className="w-6 h-6" />
        {config.label}
      </a>

      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        Opens in a new tab. You'll need a GitHub account to continue.
      </p>
    </div>
  );
}
