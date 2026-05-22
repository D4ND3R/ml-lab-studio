import { Download, FileCode2, FileJson, Plus, Play, RotateCcw, Square } from "lucide-react";
import { useMemo, useState } from "react";

import { TemplatesPanel } from "../components/editor/TemplatesPanel";
import { NotebookCell } from "../components/notebook/NotebookCell";
import { VariableExplorer } from "../components/notebook/VariableExplorer";
import { PlotPanel } from "../components/plots/PlotPanel";
import { newCell, notebookToIpynb, notebookToPython } from "../lib/notebookStore";
import { emptyFigure } from "../lib/plotUtils";
import type { DatasetRecord, NotebookCell as NotebookCellType, NotebookFile, PlotlyFigure, VariableInfo } from "../lib/types";

type Props = {
  notebook: NotebookFile;
  datasets: DatasetRecord[];
  activeDataset: DatasetRecord | null;
  variables: VariableInfo[];
  onNotebookChange: (notebook: NotebookFile) => void;
  onRunCell: (cellId: string) => void;
  onRunAll: () => void;
  onStop: () => void;
  onSave: () => void;
  onDecisionBoundary: (payload: Record<string, unknown>) => Promise<{ figure: PlotlyFigure; warning?: string }>;
  onTrainClassifier: (payload: Record<string, unknown>) => Promise<void>;
};

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function NotebookLabPage({
  notebook,
  datasets,
  activeDataset,
  variables,
  onNotebookChange,
  onRunCell,
  onRunAll,
  onStop,
  onSave,
  onDecisionBoundary,
  onTrainClassifier
}: Props) {
  const [selectedCellId, setSelectedCellId] = useState(notebook.cells[0]?.id ?? "");
  const [modelName, setModelName] = useState("model");
  const [xFeature, setXFeature] = useState("sepal_length");
  const [yFeature, setYFeature] = useState("sepal_width");
  const [targetColumn, setTargetColumn] = useState("species");
  const [boundaryFigure, setBoundaryFigure] = useState<PlotlyFigure>(emptyFigure("Decision boundary"));
  const columns = activeDataset?.columns ?? [];
  const modelVariables = useMemo(() => variables.filter((variable) => variable.capabilities.includes("predict")), [variables]);

  function setCells(cells: NotebookCellType[]) {
    onNotebookChange({ ...notebook, cells, updatedAt: new Date().toISOString() });
  }

  function updateCell(updated: NotebookCellType) {
    setCells(notebook.cells.map((cell) => (cell.id === updated.id ? updated : cell)));
    setSelectedCellId(updated.id);
  }

  function addCell(kind: "code" | "markdown") {
    const cell = newCell(kind, kind === "code" ? "" : "## Notes");
    setCells([...notebook.cells, cell]);
    setSelectedCellId(cell.id);
  }

  function deleteCell(cellId: string) {
    setCells(notebook.cells.filter((cell) => cell.id !== cellId));
  }

  function insertTemplate(code: string) {
    const targetId = selectedCellId || notebook.cells.find((cell) => cell.kind === "code")?.id;
    if (!targetId) {
      const cell = newCell("code", code);
      setCells([...notebook.cells, cell]);
      setSelectedCellId(cell.id);
      return;
    }
    setCells(
      notebook.cells.map((cell) =>
        cell.id === targetId ? { ...cell, kind: "code", source: cell.source ? `${cell.source}\n\n${code}` : code } : cell
      )
    );
  }

  async function buildBoundary() {
    if (!activeDataset) {
      return;
    }
    const response = await onDecisionBoundary({
      dataset_id: activeDataset.id,
      model_name: modelName,
      x_feature: xFeature || columns[0],
      y_feature: yFeature || columns[1],
      target_column: targetColumn || columns[columns.length - 1],
      grid_size: 140
    });
    setBoundaryFigure(response.figure);
  }

  async function trainQuickClassifier() {
    if (!activeDataset) {
      return;
    }
    await onTrainClassifier({
      dataset_id: activeDataset.id,
      algorithm: "logistic_regression",
      target_column: targetColumn || columns[columns.length - 1],
      feature_columns: [xFeature || columns[0], yFeature || columns[1]],
      model_name: modelName,
      test_size: 0.25,
      random_seed: 42
    });
  }

  return (
    <div className="notebook-layout">
      <section className="panel notebook-main">
        <div className="panel-title">
          <h1>Notebook Lab</h1>
          <div className="toolbar">
            <button onClick={() => addCell("code")}>
              <Plus size={15} aria-hidden="true" />
              Code
            </button>
            <button onClick={() => addCell("markdown")}>
              <Plus size={15} aria-hidden="true" />
              Markdown
            </button>
            <button className="primary-button" onClick={onRunAll}>
              <Play size={15} aria-hidden="true" />
              Run all
            </button>
            <button onClick={onStop}>
              <Square size={15} aria-hidden="true" />
              Stop
            </button>
            <button onClick={() => setCells(notebook.cells.map((cell) => ({ ...cell, outputs: [], stdout: "", stderr: "", error: null })))}>
              <RotateCcw size={15} aria-hidden="true" />
              Clear
            </button>
            <button onClick={onSave}>
              <FileJson size={15} aria-hidden="true" />
              Save .mlnb
            </button>
            <button onClick={() => download("notebook.py", notebookToPython(notebook), "text/x-python")}>
              <FileCode2 size={15} aria-hidden="true" />
              .py
            </button>
            <button onClick={() => download("notebook.ipynb", JSON.stringify(notebookToIpynb(notebook), null, 2), "application/json")}>
              <Download size={15} aria-hidden="true" />
              .ipynb
            </button>
          </div>
        </div>
        <div className="cell-stack">
          {notebook.cells.map((cell) => (
            <div key={cell.id} onFocus={() => setSelectedCellId(cell.id)}>
              <NotebookCell
                cell={cell}
                onChange={updateCell}
                onRun={() => onRunCell(cell.id)}
                onDelete={() => deleteCell(cell.id)}
              />
            </div>
          ))}
        </div>
      </section>

      <aside className="notebook-side">
        <section className="panel">
          <h2>Templates</h2>
          <TemplatesPanel onInsert={insertTemplate} />
        </section>

        <section className="panel">
          <h2>Variables</h2>
          <VariableExplorer variables={variables} />
        </section>

        <section className="panel">
          <h2>Decision Boundary</h2>
          <div className="form-stack">
            <label>
              Dataset
              <select value={activeDataset?.id ?? ""} disabled>
                <option>{activeDataset?.name ?? "No dataset"}</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                ))}
              </select>
            </label>
            <label>
              Model variable
              <select value={modelName} onChange={(event) => setModelName(event.target.value)}>
                <option value={modelName}>{modelName}</option>
                {modelVariables.map((variable) => (
                  <option key={variable.name}>{variable.name}</option>
                ))}
              </select>
            </label>
            <label>
              X feature
              <select value={xFeature} onChange={(event) => setXFeature(event.target.value)}>
                {columns.map((column) => (
                  <option key={column}>{column}</option>
                ))}
              </select>
            </label>
            <label>
              Y feature
              <select value={yFeature} onChange={(event) => setYFeature(event.target.value)}>
                {columns.map((column) => (
                  <option key={column}>{column}</option>
                ))}
              </select>
            </label>
            <label>
              Target
              <select value={targetColumn} onChange={(event) => setTargetColumn(event.target.value)}>
                {columns.map((column) => (
                  <option key={column}>{column}</option>
                ))}
              </select>
            </label>
            <button onClick={trainQuickClassifier} disabled={!activeDataset}>Train 2D LogisticRegression</button>
            <button className="primary-button" onClick={buildBoundary} disabled={!activeDataset}>Plot boundary</button>
          </div>
          <PlotPanel figure={boundaryFigure} />
        </section>
      </aside>
    </div>
  );
}
