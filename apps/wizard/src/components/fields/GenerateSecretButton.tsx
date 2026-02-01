'use client';

import React from 'react';
import { Wand2 } from 'lucide-react';
import { generateRandomSecret } from '@/lib/crypto';

interface GenerateSecretButtonProps {
  length: number;
  onGenerate: (secret: string) => void;
}

export function GenerateSecretButton({ length, onGenerate }: GenerateSecretButtonProps) {
  const handleGenerate = () => {
    const secret = generateRandomSecret(length);
    onGenerate(secret);
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      className="
        inline-flex items-center gap-2 px-4 py-2 rounded-lg
        bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500
        text-gray-700 dark:text-gray-200 font-medium text-sm
        transition-colors
      "
      title="Generate random secret"
    >
      <Wand2 className="h-4 w-4" />
      Generate
    </button>
  );
}
