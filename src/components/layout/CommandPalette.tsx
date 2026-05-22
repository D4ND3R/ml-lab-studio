import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { SectionId } from "../../lib/types";

type CommandAction = {
  id: string;
  label: string;
  detail: string;
  section: SectionId;
};

const commands: CommandAction[] = [
  { id: "open-datasets", label: "Open Dataset Manager", detail: "Import, edit, export data", section: "datasets" },
  { id: "open-explorer", label: "Open Data Explorer", detail: "Build 2D and 3D plots", section: "explorer" },
  { id: "open-notebook", label: "Open Notebook Lab", detail: "Run Python cells", section: "notebooks" },
  { id: "open-deep-learning", label: "Open Deep Learning Studio", detail: "Build and inspect neural networks", section: "deep-learning" },
  { id: "open-experiments", label: "Open Experiments", detail: "Compare runs and metrics", section: "experiments" }
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (section: SectionId) => void;
};

export function CommandPalette({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return commands.filter((command) => `${command.label} ${command.detail}`.toLowerCase().includes(normalized));
  }, [query]);

  if (!open) {
    return null;
  }

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="command-palette" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <label className="command-search">
          <Search size={18} aria-hidden="true" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands" />
        </label>
        <div className="command-list">
          {filtered.map((command) => (
            <button
              key={command.id}
              onClick={() => {
                onSelect(command.section);
                onClose();
              }}
            >
              <strong>{command.label}</strong>
              <span>{command.detail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
