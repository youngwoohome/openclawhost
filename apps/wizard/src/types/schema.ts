export type FieldType = 'url' | 'secret' | 'select' | 'multiselect';

export type CompletionType =
  | 'manual_confirm'
  | 'validator_success'
  | 'fields_present'
  | 'optional_any_of'
  | 'always';

export interface DependsOn {
  field: string;
  includes?: string; // For multiselect contains check
  equals?: string; // For exact match
}

export interface GenerateConfig {
  type: 'random';
  length: number;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  help?: string;
  validators?: string[];
  depends_on?: DependsOn;
  generate?: GenerateConfig;
  options?: Array<{ id: string; label: string }>;
  options_from?: string; // Reference like "providers.llm"
  dynamic_env_from?: string; // Field ID to derive env var name
  deprecated?: boolean;
}

export interface StepAction {
  id: string;
  type: 'validate_url' | 'check_access' | 'open_url';
  input_field?: string;
  admin_path?: string;
  url_template?: string;
}

export interface StepCompletion {
  type: CompletionType;
  label?: string; // For manual_confirm
  validator?: string; // For validator_success
  required_fields?: string[]; // For fields_present
  any_of?: string[]; // For optional_any_of
  allow_none?: boolean;
  none_warning?: string;
}

export interface DeployButton {
  url: string;
  label: string;
}

export interface StepDef {
  id: string;
  title: string;
  description: string;
  fields?: string[];
  checklist?: string[];
  links?: Array<{ ref: string }>;
  actions?: StepAction[];
  deploy_button?: DeployButton;
  summary?: { show_fields: string[] };
  completion: StepCompletion;
}

export interface ValidatorDef {
  id: string;
  type: 'builtin' | 'http';
  rule?: string;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
  };
}

export interface Provider {
  id: string;
  label: string;
  env: string;
}

export interface LinkDef {
  label: string;
  url: string;
}

export interface OnboardingSchema {
  version: number;
  metadata: {
    product: string;
    source_repo: string;
    notes: string[];
  };
  links: Record<string, LinkDef>;
  providers: Record<string, Provider[]>;
  validators: ValidatorDef[];
  fields: FieldDef[];
  steps: StepDef[];
}
