'use client';

import { WizardProvider } from '@/components/wizard/WizardProvider';
import { WizardShell } from '@/components/wizard/WizardShell';
import type { OnboardingSchema } from '@/types/schema';

interface WizardClientProps {
  schema: OnboardingSchema;
}

export function WizardClient({ schema }: WizardClientProps) {
  return (
    <WizardProvider schema={schema}>
      <WizardShell />
    </WizardProvider>
  );
}
