import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Template, WorkflowBlock, TabId, SavedDApp } from '../types';
import { TEMPLATES, WORKFLOW_BLOCKS, DEMO_PROJECTS, TEMPLATE_DEFAULT_BLOCKS } from '../data';
import { loadSavedApps, deleteApp, seedDemoApps } from '../services/storage';
import { TemplateLibrary } from './TemplateLibrary';
import { ApiComponentLibrary } from './ApiComponentLibrary';
import { WorkflowBuilder } from './WorkflowBuilder';
import { GeneratedConfigPanel } from './GeneratedConfigPanel';
import { CodeGenerationPreview } from './CodeGenerationPreview';
import { PermissioningPanel } from './PermissioningPanel';
import { DAppPreview } from './DAppPreview';
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

interface DashboardPaneProps {
  savedApps: SavedDApp[];
  onOpen: (app: SavedDApp) => void;
  onDelete: (id: string) => void;
  onAppUpdated: (updated: SavedDApp) => void;
  onCreateNew: () => void;
}

function DashboardPane({ savedApps, onOpen, onDelete, onAppUpdated, onCreateNew }: DashboardPaneProps) {
  const [sharingAppId, setSharingAppId] = useState<string | null>(null);

  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Builder Dashboard</p>
        <h2 className="pane-title">My dApps</h2>
        <p className="pane-desc">
          Manage your decentralized applications, track build status, and create new projects. Use
          the tabs above to access the Template Library, Workflow Builder, and more.
        </p>
      </div>

      <div className="project-grid">
        {savedApps.map((app) => (
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

            {app.sharedWith.length > 0 && (
              <div className="shared-badge">
                <Users size={11} />
                Shared with {app.sharedWith.length}
              </div>
            )}

            <div className="saved-app-actions">
              <button
                className="saved-app-action-btn saved-app-action-btn--open"
                onClick={() => onOpen(app)}
              >
                <FolderOpen size={13} />
                Open
              </button>
              <button
                className="saved-app-action-btn saved-app-action-btn--share"
                onClick={() => setSharingAppId(sharingAppId === app.id ? null : app.id)}
              >
                <Share2 size={13} />
                Share
              </button>
              <button
                className="saved-app-action-btn saved-app-action-btn--delete"
                onClick={() => onDelete(app.id)}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>

            {sharingAppId === app.id && (
              <SharePanel
                app={app}
                onUpdated={(updated) => {
                  onAppUpdated(updated);
                }}
                onClose={() => setSharingAppId(null)}
              />
            )}
          </div>
        ))}

        <div className="create-card" onClick={onCreateNew} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onCreateNew()}>
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

  // Seed demo apps on first ever load, then hydrate state.
  // TODO (production): Replace with GET /api/dapps
  useEffect(() => {
    const demoSeed: SavedDApp[] = DEMO_PROJECTS.map((p) => {
      const tmpl = TEMPLATES.find((t) => t.id === p.templateId);
      const defaultBlockIds = TEMPLATE_DEFAULT_BLOCKS[p.templateId] ?? [];
      const workflowIds = WORKFLOW_BLOCKS
        .filter((b) => defaultBlockIds.includes(b.id))
        .map((b) => b.id);
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
        sharedWith: [],
        status: p.status,
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

  const handleSaveApp = () => {
    reloadApps();
  };

  const handleGoToLibrary = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setEditingApp(null);
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
        />
      )}

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
            onOpen={handleOpenSavedApp}
            onDelete={handleDeleteApp}
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
