import Editor from "@monaco-editor/react";
import { Code2, FileText, Play, Trash2 } from "lucide-react";

import type { NotebookCell as NotebookCellType } from "../../lib/types";
import { OutputRenderer } from "./OutputRenderer";

type Props = {
  cell: NotebookCellType;
  onChange: (cell: NotebookCellType) => void;
  onRun: () => void;
  onDelete: () => void;
};

export function NotebookCell({ cell, onChange, onRun, onDelete }: Props) {
  return (
    <div className="notebook-cell">
      <div className="cell-toolbar">
        <span className="cell-kind">
          {cell.kind === "code" ? <Code2 size={15} aria-hidden="true" /> : <FileText size={15} aria-hidden="true" />}
          {cell.kind}
        </span>
        <span className="muted">{cell.executionCount ? `In [${cell.executionCount}]` : "Not run"}</span>
        {cell.durationMs ? <span className="muted">{cell.durationMs.toFixed(1)} ms</span> : null}
        {cell.kind === "code" ? (
          <button onClick={onRun}>
            <Play size={15} aria-hidden="true" />
            Run
          </button>
        ) : null}
        <button className="icon-button small" title="Delete cell" onClick={onDelete}>
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
      {cell.kind === "code" ? (
        <Editor
          height={Math.max(130, cell.source.split("\n").length * 22 + 28)}
          defaultLanguage="python"
          theme="vs-dark"
          value={cell.source}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on"
          }}
          onChange={(value) => onChange({ ...cell, source: value ?? "" })}
        />
      ) : (
        <textarea className="markdown-editor" value={cell.source} onChange={(event) => onChange({ ...cell, source: event.target.value })} />
      )}
      <OutputRenderer outputs={cell.outputs} stdout={cell.stdout} stderr={cell.stderr} error={cell.error} />
    </div>
  );
}
