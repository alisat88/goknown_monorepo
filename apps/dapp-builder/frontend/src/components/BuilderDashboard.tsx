import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Library,
  Plug,
  GitBranch,
  Braces,
  Code2,
  Shield,
  Monitor,
  Zap,
  BookOpen,
  Trash2,
  Share2,
  FolderOpen,
  Users,
  X,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Template, WorkflowBlock, TabId, SavedDApp, DemoUser, SharedRole, SharedAccess } from '../types';
import { TEMPLATES, WORKFLOW_BLOCKS, DEMO_PROJECTS, TEMPLATE_DEFAULT_BLOCKS, DEMO_USERS } from '../data';
import { loadSavedApps, deleteApp, seedDemoApps } from '../services/storage';
import { TemplateLibrary } from './TemplateLibrary';
import { ApiComponentLibrary } from './ApiComponentLibrary';
import { WorkflowBuilder } from './WorkflowBuilder';
import { GeneratedConfigPanel } from './GeneratedConfigPanel';
import { CodeGenerationPreview } from './CodeGenerationPreview';
import { PermissioningPanel } from './PermissioningPanel';
import { DAppPreview, renderTemplateMockup } from './DAppPreview';
import { DemoFlowPanel } from './DemoFlowPanel';
import { InstructionsPage } from './InstructionsPage';
import { CreateDAppWizard } from './CreateDAppWizard';
import { SharePanel } from './SharePanel';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'instructions', label: 'How It Works', icon: BookOpen },
  { id: 'dashboard', label: 'My dApps', icon: LayoutDashboard },
  { id: 'templates', label: 'Templates', icon: Library },
  { id: 'apis', label: 'API Components', icon: Plug },
  { id: 'workflow', label: 'Workflow', icon: GitBranch },
  { id: 'config', label: 'Config', icon: Braces },
  { id: 'code', label: 'Code Preview', icon: Code2 },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'preview', label: 'dApp Preview', icon: Monitor },
  { id: 'demo', label: 'Demo Flow', icon: Zap },
];

// Ownership for the demo seed — defines who owns each demo app and who has access.
// TODO (production): Ownership and sharing are managed server-side.
const DEMO_SEED_OWNERSHIP: Record<string, { ownerId: string; sharedWith: string[]; sharedAccess: SharedAccess[] }> = {
  'aviation-ledger': {
    ownerId: 'chuck@goknown.io',
    sharedWith: ['alisa@goknown.io', 'fiona@goknown.io'],
    sharedAccess: [
      { email: 'alisa@goknown.io', role: 'Reviewer' },
      { email: 'fiona@goknown.io', role: 'Viewer' },
    ],
  },
  'token-rewards': {
    ownerId: 'alisa@goknown.io',
    sharedWith: ['chuck@goknown.io'],
    sharedAccess: [{ email: 'chuck@goknown.io', role: 'Builder' }],
  },
  'dao-voting-demo': {
    ownerId: 'drlu@goknown.io',
    sharedWith: ['drsam@goknown.io'],
    sharedAccess: [{ email: 'drsam@goknown.io', role: 'Reviewer' }],
  },
  'escrow-flow': {
    ownerId: 'mike@goknown.io',
    sharedWith: ['leo@goknown.io', 'connie@goknown.io'],
    sharedAccess: [
      { email: 'leo@goknown.io', role: 'Reviewer' },
      { email: 'connie@goknown.io', role: 'Viewer' },
    ],
  },
};

function statusClass(status: string) {
  if (status === 'Draft') return 'status-badge--draft';
  if (status === 'Preview') return 'status-badge--preview';
  if (status === 'Ready for API mapping') return 'status-badge--api';
  if (status === 'Permission review') return 'status-badge--review';
  return 'status-badge--draft';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getUserRole(app: SavedDApp, email: string): 'Owner' | SharedRole | null {
  if (app.ownerId === email) return 'Owner';
  const access = (app.sharedAccess ?? []).find((a) => a.email === email.toLowerCase());
  if (access) return access.role;
  if (app.sharedWith.map((e) => e.toLowerCase()).includes(email.toLowerCase())) return 'Viewer';
  return null;
}

function CurrentUserBar({ currentUser, onChange }: { currentUser: DemoUser; onChange: (u: DemoUser) => void }) {
  return (
    <div className="demo-user-bar">
      <span className="demo-user-label">Viewing as:</span>
      <div className="demo-user-btns">
        {DEMO_USERS.map((u) => (
          <button
            key={u.email}
            className={`demo-user-btn${currentUser.email === u.email ? ' active' : ''}`}
            onClick={() => onChange(u)}
            title={u.email}
          >
            {u.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function DAppPreviewPage({
  app,
  currentUserEmail,
  onClose,
  onGoToLibrary,
}: {
  app: SavedDApp;
  currentUserEmail: string;
  onClose: () => void;
  onGoToLibrary: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const role = getUserRole(app, currentUserEmail);
  const mockUrl = `/dapp-builder/preview/${app.id}`;
  const templateName = TEMPLATES.find((t) => t.id === app.template)?.name ?? app.template;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(mockUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    if (!app.generatedCode) return;
    const url = URL.createObjectURL(new Blob([app.generatedCode], { type: 'text/html' }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dapp-preview-page" role="dialog" aria-modal="true" aria-label={`${app.dappName} preview`}>

        <div className="dapp-preview-page-header">
          <div className="dapp-preview-page-nav">
            <button className="dapp-preview-back-btn" onClick={onGoToLibrary}>
              <ArrowLeft size={13} />
              Back to Library
            </button>
            <button className="dapp-preview-back-btn dapp-preview-back-btn--ghost" onClick={onClose}>
              <ArrowLeft size={13} />
              Back to Builder
            </button>
          </div>

          <div className="dapp-preview-page-title-row">
            <div className="dapp-preview-page-title-block">
              <div className="dapp-preview-page-name">{app.dappName}</div>
              <div className="dapp-preview-page-template">{templateName}</div>
            </div>
            <div className="dapp-preview-page-badges">
              <span className="dapp-preview-badge dapp-preview-badge--mode">Preview Mode</span>
              {app.generatedCode && (
                <span className="dapp-preview-badge dapp-preview-badge--built">Generated by DApp Builder</span>
              )}
              {role && (
                <span className={`dapp-preview-badge dapp-preview-badge--role dapp-preview-badge--role-${role.toLowerCase()}`}>
                  {role}
                </span>
              )}
            </div>
            <div className="dapp-preview-page-actions">
              {app.generatedCode && (
                <button className="open-newtab-btn" onClick={handleOpenNewTab}>
                  <ExternalLink size={13} />
                  Open in new tab
                </button>
              )}
              <button className="wizard-close-btn" onClick={onClose} aria-label="Close preview">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="dapp-preview-page-meta">
            <div className="dapp-preview-mock-url">
              <span className="dapp-preview-meta-label">Mock URL</span>
              <code className="dapp-preview-mock-url-path">{mockUrl}</code>
              <button className="dapp-preview-copy-btn" onClick={handleCopyUrl} aria-label="Copy URL">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {app.workflow.length > 0 && (
              <div className="dapp-preview-workflow-row">
                <span className="dapp-preview-meta-label">Workflow</span>
                <span className="dapp-preview-workflow-steps">
                  {app.workflow.map((id, i) => (
                    <React.Fragment key={id}>
                      {i > 0 && <span className="dapp-preview-workflow-sep">→</span>}
                      <span className="dapp-preview-workflow-step">
                        {WORKFLOW_BLOCKS.find((b) => b.id === id)?.label ?? id}
                      </span>
                    </React.Fragment>
                  ))}
                </span>
              </div>
            )}

            {role === 'Owner' && app.sharedWith.length > 0 && (
              <div className="dapp-preview-shared-row">
                <span className="dapp-preview-meta-label">Shared with</span>
                <div className="dapp-preview-shared-list">
                  {app.sharedWith.map((email) => {
                    const sharedRole = (app.sharedAccess ?? []).find((a) => a.email === email)?.role;
                    return (
                      <span key={email} className="dapp-preview-shared-user">
                        {email}
                        {sharedRole && (
                          <span className={`shared-role-badge shared-role-badge--${sharedRole.toLowerCase()}`}>
                            {sharedRole}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dapp-preview-page-body">
          {app.generatedCode ? (
            <iframe
              srcDoc={app.generatedCode}
              title={`${app.dappName} live preview`}
              sandbox="allow-scripts allow-popups allow-forms allow-modals"
              className="dapp-preview-iframe"
            />
          ) : (
            <div className="dapp-preview-mockup-wrapper">
              <div className="dapp-preview-mockup-note">
                Template mockup — generate code in the builder to see your live dApp here
              </div>
              <div className="preview-frame dapp-preview-mockup-frame">
                <div className="preview-frame-header">
                  <h3 className="preview-frame-title">{templateName}</h3>
                  <span className="preview-badge">Mock preview</span>
                </div>
                {renderTemplateMockup(app.template)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DashboardPaneProps {
  savedApps: SavedDApp[];
  currentUser: DemoUser;
  onOpen: (app: SavedDApp) => void;
  onDelete: (id: string) => void;
  onAppUpdated: (updated: SavedDApp) => void;
  onCreateNew: () => void;
  onPreview: (app: SavedDApp) => void;
}

function DashboardPane({
  savedApps,
  currentUser,
  onOpen,
  onDelete,
  onAppUpdated,
  onCreateNew,
  onPreview,
}: DashboardPaneProps) {
  const [sharingAppId, setSharingAppId] = useState<string | null>(null);

  const myApps = savedApps.filter((app) => app.ownerId === currentUser.email);
  const sharedApps = savedApps.filter(
    (app) =>
      app.ownerId !== currentUser.email &&
      app.sharedWith.map((e) => e.toLowerCase()).includes(currentUser.email.toLowerCase())
  );

  const renderCard = (app: SavedDApp) => {
    const role = getUserRole(app, currentUser.email);
    const canOpen = role === 'Owner' || role === 'Builder' || role === 'Reviewer';
    const canShare = role === 'Owner';
    const canDelete = role === 'Owner';

    return (
      <div key={app.id} className="saved-app-card">
        <div className="saved-app-card-top">
          <div>
            <div className="saved-app-name">{app.dappName}</div>
            <div className="saved-app-meta">
              <span>{TEMPLATES.find((t) => t.id === app.template)?.name ?? app.template}</span>
              <span className="saved-app-date">· {formatDate(app.createdAt)}</span>
            </div>
          </div>
          <span className={`status-badge ${statusClass(app.status)}`}>{app.status}</span>
        </div>

        <div className="saved-app-badges-row">
          {app.sharedWith.length > 0 && role === 'Owner' && (
            <div className="shared-badge">
              <Users size={11} />
              Shared with {app.sharedWith.length}
            </div>
          )}
          {role && role !== 'Owner' && (
            <span className={`shared-role-badge shared-role-badge--${role.toLowerCase()}`}>
              {role}
            </span>
          )}
          {app.generatedCode && (
            <span className="generated-badge">Code ready</span>
          )}
        </div>

        <div className="saved-app-actions">
          <button
            className="saved-app-action-btn saved-app-action-btn--preview"
            onClick={() => onPreview(app)}
          >
            <Monitor size={13} />
            Preview
          </button>
          {canOpen && (
            <button
              className="saved-app-action-btn saved-app-action-btn--open"
              onClick={() => onOpen(app)}
            >
              <FolderOpen size={13} />
              Open
            </button>
          )}
          {canShare && (
            <button
              className="saved-app-action-btn saved-app-action-btn--share"
              onClick={() => setSharingAppId(sharingAppId === app.id ? null : app.id)}
            >
              <Share2 size={13} />
              Share
            </button>
          )}
          {canDelete && (
            <button
              className="saved-app-action-btn saved-app-action-btn--delete"
              onClick={() => onDelete(app.id)}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>

        {sharingAppId === app.id && canShare && (
          <SharePanel
            app={app}
            onUpdated={(updated) => onAppUpdated(updated)}
            onClose={() => setSharingAppId(null)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Builder Dashboard</p>
        <h2 className="pane-title">My dApps</h2>
        <p className="pane-desc">
          Manage your decentralized applications. Use the tabs above to access the Template Library,
          Workflow Builder, and more.
        </p>
      </div>

      {myApps.length > 0 && (
        <div className="library-section">
          <div className="library-section-title">My Apps</div>
          <div className="project-grid">
            {myApps.map(renderCard)}
          </div>
        </div>
      )}

      {sharedApps.length > 0 && (
        <div className="library-section">
          <div className="library-section-title">Shared with Me</div>
          <div className="project-grid">
            {sharedApps.map(renderCard)}
          </div>
        </div>
      )}

      {myApps.length === 0 && sharedApps.length === 0 && (
        <div className="library-empty">
          No dApps visible for <strong>{currentUser.name}</strong>. Create a new one, or ask a teammate to share their app with {currentUser.email}.
        </div>
      )}

      <div className={`project-grid${myApps.length > 0 || sharedApps.length > 0 ? ' project-grid--create-only' : ''}`}>
        <div
          className="create-card"
          onClick={onCreateNew}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onCreateNew()}
        >
          <span className="create-card-plus">+</span>
          <span>Create New dApp</span>
        </div>
      </div>
    </div>
  );
}

export function BuilderDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('instructions');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowBlock[]>([]);
  const [demoStarted, setDemoStarted] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [editingApp, setEditingApp] = useState<SavedDApp | null>(null);
  const [savedApps, setSavedApps] = useState<SavedDApp[]>([]);
  const [apiKey, setApiKey] = useState(
    (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ?? ''
  );
  const [previewApp, setPreviewApp] = useState<SavedDApp | null>(null);
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0]);

  // Seed demo apps with ownership/sharing on first load (or when seed version changes).
  // TODO (production): Replace with GET /api/dapps
  useEffect(() => {
    const demoSeed: SavedDApp[] = DEMO_PROJECTS.map((p) => {
      const tmpl = TEMPLATES.find((t) => t.id === p.templateId);
      const defaultBlockIds = TEMPLATE_DEFAULT_BLOCKS[p.templateId] ?? [];
      const workflowIds = WORKFLOW_BLOCKS
        .filter((b) => defaultBlockIds.includes(b.id))
        .map((b) => b.id);
      const ownership = DEMO_SEED_OWNERSHIP[p.id] ?? {
        ownerId: 'alisa@goknown.io',
        sharedWith: [],
        sharedAccess: [],
      };
      return {
        id: p.id,
        dappName: p.name,
        template: p.templateId,
        permissionModel: tmpl?.permissionModel ?? 'role-based',
        apis: tmpl?.apiIds ?? [],
        workflow: workflowIds,
        generatedCode: '',
        createdAt: '2026-06-15T00:00:00.000Z',
        updatedAt: '2026-06-15T00:00:00.000Z',
        status: p.status,
        ...ownership,
      };
    });
    seedDemoApps(demoSeed);
    setSavedApps(loadSavedApps());
  }, []);

  const reloadApps = () => setSavedApps(loadSavedApps());

  const handleUseTemplate = (t: Template) => {
    const defaultBlockIds = TEMPLATE_DEFAULT_BLOCKS[t.id] ?? [];
    const blocks = WORKFLOW_BLOCKS.filter((b) => defaultBlockIds.includes(b.id));
    setSelectedTemplate(t);
    setWorkflowSteps(blocks);
    setEditingApp(null);
    setWizardStep(1);
    setWizardOpen(true);
  };

  const handleOpenSavedApp = (app: SavedDApp) => {
    const tmpl =
      TEMPLATES.find((t) => t.id === app.template) ??
      TEMPLATES.find((t) => t.id === 'custom')!;
    const blocks = WORKFLOW_BLOCKS.filter((b) => app.workflow.includes(b.id));
    setSelectedTemplate(tmpl);
    setWorkflowSteps(blocks);
    setEditingApp(app);
    setWizardStep(1);
    setWizardOpen(true);
  };

  const handleDeleteApp = (id: string) => {
    deleteApp(id);
    reloadApps();
  };

  const handleSaveApp = () => reloadApps();

  const handleGoToLibrary = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setEditingApp(null);
    setPreviewApp(null);
    setActiveTab('dashboard');
    reloadApps();
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setEditingApp(null);
  };

  const handleStartChuckDemo = () => {
    const ledgerTemplate = TEMPLATES.find((t) => t.id === 'ledger-app')!;
    const demoBlockIds = ['authenticate-user', 'check-dapp-permission', 'read-ledger-entries'];
    const demoBlocks = WORKFLOW_BLOCKS.filter((b) => demoBlockIds.includes(b.id));
    setSelectedTemplate(ledgerTemplate);
    setWorkflowSteps(demoBlocks);
    setDemoStarted(true);
    setActiveTab('workflow');
  };

  return (
    <div className="builder">
      {previewApp && (
        <DAppPreviewPage
          app={previewApp}
          currentUserEmail={currentUser.email}
          onClose={() => setPreviewApp(null)}
          onGoToLibrary={handleGoToLibrary}
        />
      )}

      {wizardOpen && selectedTemplate && (
        <CreateDAppWizard
          template={selectedTemplate}
          workflowSteps={workflowSteps}
          onWorkflowChange={setWorkflowSteps}
          wizardStep={wizardStep}
          onStepChange={setWizardStep}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onClose={handleCloseWizard}
          editingApp={editingApp ?? undefined}
          onSaveApp={handleSaveApp}
          onGoToLibrary={handleGoToLibrary}
          currentUserEmail={currentUser.email}
        />
      )}

      <CurrentUserBar currentUser={currentUser} onChange={setCurrentUser} />

      <div className="builder-tabs" role="tablist" aria-label="Builder sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`builder-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeTab === 'instructions' && (
          <InstructionsPage onNavigate={setActiveTab} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardPane
            savedApps={savedApps}
            currentUser={currentUser}
            onOpen={handleOpenSavedApp}
            onDelete={handleDeleteApp}
            onPreview={(app) => setPreviewApp(app)}
            onAppUpdated={(updated) => {
              setSavedApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            }}
            onCreateNew={() => setActiveTab('templates')}
          />
        )}
        {activeTab === 'templates' && (
          <TemplateLibrary
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onUseTemplate={handleUseTemplate}
          />
        )}
        {activeTab === 'apis' && <ApiComponentLibrary />}
        {activeTab === 'workflow' && (
          <WorkflowBuilder
            workflowSteps={workflowSteps}
            onWorkflowChange={setWorkflowSteps}
            selectedTemplate={selectedTemplate}
          />
        )}
        {activeTab === 'config' && (
          <GeneratedConfigPanel
            selectedTemplate={selectedTemplate}
            workflowSteps={workflowSteps}
          />
        )}
        {activeTab === 'code' && (
          <CodeGenerationPreview
            selectedTemplate={selectedTemplate}
            workflowSteps={workflowSteps}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            onSaveApp={handleSaveApp}
            currentUserEmail={currentUser.email}
          />
        )}
        {activeTab === 'permissions' && <PermissioningPanel />}
        {activeTab === 'preview' && (
          <DAppPreview selectedTemplate={selectedTemplate} />
        )}
        {activeTab === 'demo' && (
          <DemoFlowPanel
            demoStarted={demoStarted}
            selectedTemplate={selectedTemplate}
            workflowSteps={workflowSteps}
            onStartDemo={handleStartChuckDemo}
            onNavigateTab={setActiveTab}
          />
        )}
      </div>
    </div>
  );
}
