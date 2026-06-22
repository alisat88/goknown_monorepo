import React, { useState } from 'react';
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
} from 'lucide-react';
import { Template, WorkflowBlock, TabId } from '../types';
import { TEMPLATES, WORKFLOW_BLOCKS, DEMO_PROJECTS, TEMPLATE_DEFAULT_BLOCKS } from '../data';
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

function DashboardPane({ selectedTemplate }: { selectedTemplate: Template | null }) {
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
        {DEMO_PROJECTS.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-card-name">{project.name}</div>
            <div className="project-card-meta">
              Template:{' '}
              {TEMPLATES.find((t) => t.id === project.templateId)?.name ?? project.templateId}
            </div>
            <span className={`status-badge ${statusClass(project.status)}`}>
              {project.status}
            </span>
          </div>
        ))}
        <div className="create-card">
          <span className="create-card-plus">+</span>
          <span>Create New dApp</span>
        </div>
      </div>

      {selectedTemplate && (
        <div className="active-template-notice">
          Active template:{' '}
          <strong>{selectedTemplate.name}</strong> — workflow config will use this
          template's APIs and permission model.
        </div>
      )}
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
  const [apiKey, setApiKey] = useState(
    (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ?? ''
  );

  const handleUseTemplate = (t: Template) => {
    const defaultBlockIds = TEMPLATE_DEFAULT_BLOCKS[t.id] ?? [];
    const blocks = WORKFLOW_BLOCKS.filter((b) => defaultBlockIds.includes(b.id));
    setSelectedTemplate(t);
    setWorkflowSteps(blocks);
    setWizardStep(1);
    setWizardOpen(true);
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
          onClose={() => { setWizardOpen(false); setWizardStep(1); }}
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
          <DashboardPane selectedTemplate={selectedTemplate} />
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
