export type TemplateStatus = 'Mock template' | 'Coming soon' | 'Custom';
export type SecurityLevel = 'auth' | 'dapp' | 'readonly' | 'admin';

// Authenticated user passed from DAppGenius into the builder via URL params.
// See context/AuthContext.tsx for resolution logic.
export interface AuthUser {
  userId: string;
  userName: string;
  userEmail: string;
}

// Lifecycle statuses that reflect where a dApp is in its creation journey.
export type ProjectStatus =
  | 'Draft'             // being configured; not yet saved as a library entry
  | 'Saved'             // app object created and live in the library; runtime available
  | 'Generated'         // Anthropic code was generated; live HTML iframe available
  | 'Shared'            // at least one collaborator has been granted access
  | 'Permission Review'; // role/access changes pending review

export type SharedRole = 'Viewer' | 'Builder' | 'Reviewer';

export interface SharedAccess {
  email: string;
  role: SharedRole;
  userId?: string;  // backend UUID — present when loaded from the API
}

export interface DemoUser {
  name: string;
  email: string;
  team?: string;
}

export type TabId =
  | 'instructions'
  | 'tutorials'
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
  description: string;
  userPrompt?: string;       // full app prompt (≤ 1000 words)
  generatedConfig?: string;  // JSON-stringified full config
  internalAppPath?: string;  // simulated path: /dapp-builder/apps/{id}
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
  ownerName: string;
  status: ProjectStatus;
  version: number;
}
