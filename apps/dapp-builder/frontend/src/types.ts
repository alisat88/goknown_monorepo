export type TemplateStatus = 'Mock template' | 'Coming soon' | 'Custom';
export type SecurityLevel = 'auth' | 'dapp' | 'readonly' | 'admin';
export type ProjectStatus = 'Draft' | 'Preview' | 'Ready for API mapping' | 'Permission review';
export type TabId =
  | 'instructions'
  | 'dashboard'
  | 'templates'
  | 'apis'
  | 'workflow'
  | 'config'
  | 'code'
  | 'permissions'
  | 'preview'
  | 'demo';

export interface Template {
  id: string;
  name: string;
  description: string;
  suggestedUseCase: string;
  includedComponents: string[];
  status: TemplateStatus;
  apiIds: string[];
  permissionModel: string;
}

export interface WorkflowBlock {
  id: string;
  label: string;
  apiId?: string;
}

export interface ApiComponent {
  id: string;
  name: string;
  purpose: string;
  endpoint: string;
  inputOutput: string;
  securityNote: string;
  securityLevel: SecurityLevel;
}

export interface DAppProject {
  id: string;
  name: string;
  status: ProjectStatus;
  templateId: string;
}
