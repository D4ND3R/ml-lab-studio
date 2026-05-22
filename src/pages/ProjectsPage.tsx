import { FolderOpen, Plus, Save } from "lucide-react";

import type { ProjectRecord } from "../lib/types";

type Props = {
  project: ProjectRecord;
  recent: ProjectRecord[];
  onCreate: () => void;
  onActivate: (project: ProjectRecord) => void;
  onSave: () => void;
};

export function ProjectsPage({ project, recent, onCreate, onActivate, onSave }: Props) {
  return (
    <div className="page-grid">
      <section className="panel span-2">
        <div className="panel-title">
          <h1>Projects</h1>
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
    </div>
  );
}
