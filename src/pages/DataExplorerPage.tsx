import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { PlotPanel } from "../components/plots/PlotPanel";
import { classDistributionFigure, correlationHeatmap, emptyFigure } from "../lib/plotUtils";
import type { DatasetRecord, PlotlyFigure } from "../lib/types";

type Props = {
  dataset: DatasetRecord | null;
  onPlot: (payload: Record<string, unknown>) => Promise<{ figure: PlotlyFigure; warning?: string }>;
};

const plotTypes = ["scatter", "line", "bar", "histogram", "box", "heatmap", "correlation", "scatter3d", "surface"] as const;

export function DataExplorerPage({ dataset, onPlot }: Props) {
  const [plotType, setPlotType] = useState<(typeof plotTypes)[number]>("scatter");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [z, setZ] = useState("");
  const [color, setColor] = useState("");
  const [sampleSize, setSampleSize] = useState(500);
  const [figure, setFigure] = useState<PlotlyFigure>(emptyFigure("Select data and build a plot"));
  const columns = dataset?.columns ?? [];
  const categoricalColumns = useMemo(() => dataset?.schema.filter((column) => column.semantic_type === "categorical").map((column) => column.name) ?? [], [dataset]);

  async function buildPlot() {
    if (!dataset) {
      return;
    }
    if (plotType === "correlation") {
      setFigure(correlationHeatmap(dataset));
      return;
    }
    const response = await onPlot({
      dataset_id: dataset.id,
      plot_type: plotType,
      x: x || columns[0],
      y: y || columns[1],
      z: z || columns[2],
      color: color || undefined,
      sample_size: sampleSize
    });
    setFigure(response.figure);
  }

  return (
    <div className="page-grid">
      <section className="panel span-2">
        <div className="panel-title">
          <h1>Data Explorer</h1>
          <button className="primary-button" onClick={buildPlot} disabled={!dataset}>
            <RefreshCw size={15} aria-hidden="true" />
            Build plot
          </button>
        </div>
        <div className="form-grid six">
          <label>
            View
            <select value={plotType} onChange={(event) => setPlotType(event.target.value as (typeof plotTypes)[number])}>
              {plotTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            X column
            <select value={x} onChange={(event) => setX(event.target.value)}>
              <option value="">Auto</option>
              {columns.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>
          </label>
          <label>
            Y column
            <select value={y} onChange={(event) => setY(event.target.value)}>
              <option value="">Auto</option>
              {columns.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>
          </label>
          <label>
            Z column
            <select value={z} onChange={(event) => setZ(event.target.value)}>
              <option value="">Auto</option>
              {columns.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>
          </label>
          <label>
            Color by
            <select value={color} onChange={(event) => setColor(event.target.value)}>
              <option value="">None</option>
              {columns.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>
          </label>
          <label>
            Sample size: {sampleSize}
            <input type="range" min={50} max={5000} step={50} value={sampleSize} onChange={(event) => setSampleSize(Number(event.target.value))} />
          </label>
        </div>
        <PlotPanel figure={figure} />
      </section>

      <section className="panel">
        <h2>Explorer views</h2>
        <div className="view-tabs">
          <button>Raw table</button>
          <button>Schema</button>
          <button>Summary</button>
          <button>Missing</button>
          <button>PCA</button>
          <button>Embeddings</button>
          <button>Image browser</button>
        </div>
        {dataset ? (
          <div className="schema-list">
            {dataset.stats.map((row, index) => (
              <div key={index} className="schema-row">
                <span>{String(row.column)}</span>
                <small>mean {Number(row.mean ?? 0).toFixed(2)}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-note">Open a dataset to inspect schema, missing values, class balance, PCA, and embeddings.</p>
        )}
      </section>

      {dataset && categoricalColumns.length > 0 ? (
        <section className="panel span-3">
          <PlotPanel figure={classDistributionFigure(dataset, categoricalColumns[0])} title="Class balance visualization" />
        </section>
      ) : null}
    </div>
  );
}
