import { ClipboardPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { templates } from "../../lib/templates";
import type { TemplateSnippet } from "../../lib/types";

type Props = {
  onInsert: (code: string) => void;
};

const categories = ["All", "Data Prep", "Classical ML", "Visualization", "Deep Learning"] as const;

export function TemplatesPanel({ onInsert }: Props) {
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const filtered = useMemo<TemplateSnippet[]>(() => {
    return category === "All" ? templates : templates.filter((template) => template.category === category);
  }, [category]);

  return (
    <div className="templates-panel">
      <div className="segmented">
        {categories.map((item) => (
          <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="template-list">
        {filtered.map((template) => (
          <button key={template.id} onClick={() => onInsert(template.code)}>
            <ClipboardPlus size={15} aria-hidden="true" />
            <span>{template.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
