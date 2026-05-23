import { BarChart3, BrainCircuit, Database, FolderOpen, NotebookTabs, Plus, Save, Workflow } from "lucide-react";

import { MLAssistantPanel } from "../components/assistant/MLAssistantPanel";
import { WorkflowRail } from "../components/layout/WorkflowRail";
import type { AssistantSuggestion } from "../lib/assistant";
import type { ProjectRecord } from "../lib/types";
import type { SectionId } from "../lib/types";

type Props = {
  project: ProjectRecord;
  recent: ProjectRecord[];
  datasetCount: number;
  modelCount: number;
  runCount: number;
  suggestions: AssistantSuggestion[];
  onCreate: () => void;
  onActivate: (project: ProjectRecord) => void;
  onSave: () => void;
  onNavigate: (section: SectionId) => void;
  onLoadSample: () => void;
};

export function ProjectsPage({
  project,
  recent,
  datasetCount,
  modelCount,
  runCount,
  suggestions,
  onCreate,
  onActivate,
  onSave,
  onNavigate,
  onLoadSample
}: Props) {
  return (
    <div className="page-grid">
      <section className="workspace-overview span-3">
        <div className="overview-title">
          <FolderOpen size={24} aria-hidden="true" />
          <div>
            <span className="muted">Active workspace</span>
            <h1>{project.name}</h1>
            <p className="small">{project.path}</p>
          </div>
        </div>
        <div className="overview-actions">
          <button className="primary-button" onClick={onLoadSample}>
            <Database size={16} aria-hidden="true" />
            Load Iris workflow
          </button>
          <button onClick={() => onNavigate("notebooks")}>
            <NotebookTabs size={16} aria-hidden="true" />
            Notebook
          </button>
          <button onClick={() => onNavigate("deep-learning")}>
            <BrainCircuit size={16} aria-hidden="true" />
            Neural net
          </button>
        </div>
        <div className="overview-meter">
          <WorkflowRail datasetCount={datasetCount} modelCount={modelCount} runCount={runCount} />
          <dl className="metric-grid wide">
            <div>
              <dt>Datasets</dt>
              <dd>{datasetCount}</dd>
            </div>
            <div>
              <dt>Models</dt>
              <dd>{modelCount}</dd>
            </div>
            <div>
              <dt>Runs</dt>
              <dd>{runCount}</dd>
            </div>
            <div>
              <dt>Build</dt>
              <dd>0.1.2</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="panel span-2">
        <div className="panel-title">
          <h1>Project System</h1>
          <div className="toolbar">
            <button onClick={onCreate}>
              <Plus size={15} aria-hidden="true" />
              Create project
            </button>
            <button className="primary-button" onClick={onSave}>
              <Save size={15} aria-hidden="true" />
              Save metadata
            </button>
          </div>
        </div>
        <dl className="metric-grid wide">
          <div>
            <dt>Name</dt>
            <dd>{project.name}</dd>
          </div>
          <div>
            <dt>Path</dt>
            <dd>{project.path}</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>.mlstudio/project.json</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{new Date(project.updatedAt).toLocaleString()}</dd>
          </div>
        </dl>
        <div className="project-tree">
          <code>.mlstudio/project.json</code>
          <code>datasets/</code>
          <code>notebooks/</code>
          <code>models/</code>
          <code>exports/</code>
          <code>runs/</code>
          <code>architectures/</code>
        </div>
      </section>

      <section className="panel">
        <h2>Command Center</h2>
        <div className="action-grid">
          <button onClick={() => onNavigate("datasets")}>
            <Database size={17} aria-hidden="true" />
            <span>Dataset Manager</span>
          </button>
          <button onClick={() => onNavigate("explorer")}>
            <BarChart3 size={17} aria-hidden="true" />
            <span>Data Explorer</span>
          </button>
          <button onClick={() => onNavigate("models")}>
            <Workflow size={17} aria-hidden="true" />
            <span>Model Manager</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Recent projects</h2>
        <div className="project-list">
          {recent.map((item) => (
            <button key={item.id} onClick={() => onActivate(item)} className={item.id === project.id ? "selected-card" : ""}>
              <FolderOpen size={16} aria-hidden="true" />
              <span>{item.name}</span>
              <small>{item.path}</small>
            </button>
          ))}
          {recent.length === 0 ? <p className="empty-note">Create a project or load the sample Iris demo.</p> : null}
        </div>
      </section>

      <section className="panel span-2">
        <h2>ML Assistant</h2>
        <MLAssistantPanel suggestions={suggestions} />
      </section>
    </div>
  );
}
