'use client';

import React from 'react';
import type { FieldDef } from '@/types/schema';
import { useWizard } from '../wizard/WizardProvider';
import { resolveOptionsFrom } from '@/lib/schema-utils';
import { UrlField } from './UrlField';
import { SecretField } from './SecretField';
import { SelectField } from './SelectField';
import { MultiselectField } from './MultiselectField';

interface FieldRendererProps {
  field: FieldDef;
}

export function FieldRenderer({ field }: FieldRendererProps) {
  const { state, schema } = useWizard();
  const fieldState = state.fields[field.id];

  switch (field.type) {
    case 'url':
      return <UrlField field={field} state={fieldState} />;

    case 'secret':
      return <SecretField field={field} state={fieldState} />;

    case 'select': {
      const options = resolveOptionsFrom(field, schema);
      return <SelectField field={field} state={fieldState} options={options} />;
    }

    case 'multiselect': {
      const options = resolveOptionsFrom(field, schema);
      return <MultiselectField field={field} state={fieldState} options={options} />;
    }

    default:
      return (
        <div className="text-red-500">
          Unknown field type: {(field as FieldDef).type}
        </div>
      );
  }
}
