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
} from 'lucide-react';
import { Template, WorkflowBlock, TabId } from '../types';
import { TEMPLATES, WORKFLOW_BLOCKS, DEMO_PROJECTS } from '../data';
import { TemplateLibrary } from './TemplateLibrary';
import { ApiComponentLibrary } from './ApiComponentLibrary';
import { WorkflowBuilder } from './WorkflowBuilder';
import { GeneratedConfigPanel } from './GeneratedConfigPanel';
import { CodeGenerationPreview } from './CodeGenerationPreview';
import { PermissioningPanel } from './PermissioningPanel';
import { DAppPreview } from './DAppPreview';
import { DemoFlowPanel } from './DemoFlowPanel';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
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

function DashboardPane({
  selectedTemplate,
}: {
  selectedTemplate: Template | null;
}) {
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
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowBlock[]>([]);
  const [demoStarted, setDemoStarted] = useState(false);

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
        {activeTab === 'dashboard' && (
          <DashboardPane selectedTemplate={selectedTemplate} />
        )}
        {activeTab === 'templates' && (
          <TemplateLibrary
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
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
