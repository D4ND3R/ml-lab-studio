import {
  BarChart3,
  BrainCircuit,
  Database,
  FlaskConical,
  FolderKanban,
  LineChart,
  NotebookTabs,
  Settings,
  Workflow
} from "lucide-react";

import type { SectionId, SidebarItem } from "../../lib/types";

const items: SidebarItem[] = [
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "datasets", label: "Datasets", icon: Database },
  { id: "explorer", label: "Data Explorer", icon: BarChart3 },
  { id: "notebooks", label: "Notebook Lab", icon: NotebookTabs },
  { id: "deep-learning", label: "Deep Learning Studio", icon: BrainCircuit },
  { id: "models", label: "Models", icon: Workflow },
  { id: "experiments", label: "Experiments", icon: FlaskConical },
  { id: "settings", label: "Settings", icon: Settings }
];

type Props = {
  active: SectionId;
  onChange: (section: SectionId) => void;
};

export function Sidebar({ active, onChange }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <LineChart aria-hidden="true" />
        <div>
          <strong>ML Lab Studio</strong>
          <span>Local ML workspace</span>
        </div>
      </div>
      <nav className="nav-list" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={active === item.id ? "nav-item active" : "nav-item"} onClick={() => onChange(item.id)}>
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
