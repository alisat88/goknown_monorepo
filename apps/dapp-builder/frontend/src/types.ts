export type TemplateStatus = 'Mock template' | 'Coming soon' | 'Custom';
export type SecurityLevel = 'auth' | 'dapp' | 'readonly' | 'admin';
export type ProjectStatus = 'Draft' | 'Preview' | 'Ready for API mapping' | 'Permission review';
export type SharedRole = 'Viewer' | 'Builder' | 'Reviewer';

export interface SharedAccess {
  email: string;
  role: SharedRole;
}

export interface DemoUser {
  name: string;
  email: string;
}
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

export interface SavedDApp {
  id: string;
  dappName: string;
  template: string;
  permissionModel: string;
  apis: string[];
  workflow: string[];
  generatedCode: string;
  createdAt: string;
  updatedAt: string;
  sharedWith: string[];
  sharedAccess: SharedAccess[];
  ownerId: string;
  status: ProjectStatus;
}
