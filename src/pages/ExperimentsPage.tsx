import { FileDown, RefreshCw, Trash2 } from "lucide-react";

import type { ExperimentRun } from "../lib/types";

type Props = {
  runs: ExperimentRun[];
  onRefresh: () => void;
  onLogDemo: () => void;
  onDelete: (runId: string) => void;
  onExport: () => void;
};

export function ExperimentsPage({ runs, onRefresh, onLogDemo, onDelete, onExport }: Props) {
  return (
    <div className="page-grid">
      <section className="panel span-3">
        <div className="panel-title">
          <h1>Experiment Tracker</h1>
          <div className="toolbar">
            <button onClick={onRefresh}>
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
            <button onClick={onLogDemo}>Log current run</button>
            <button onClick={onExport}>
              <FileDown size={15} aria-hidden="true" />
              Export report
            </button>
          </div>
        </div>
        <div className="experiment-table">
          <table className="dataset-table">
            <thead>
              <tr>
                <th>Run</th>
                <th>Timestamp</th>
                <th>Dataset</th>
                <th>Model</th>
                <th>Metrics</th>
                <th>Device</th>
                <th> </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.run_id}>
                  <td>{run.run_name}</td>
                  <td>{new Date(run.timestamp).toLocaleString()}</td>
                  <td>{run.dataset_used ?? ""}</td>
                  <td>{run.model_type ?? ""}</td>
                  <td>{Object.entries(run.metrics).map(([key, value]) => `${key}: ${String(value)}`).join(", ")}</td>
                  <td>{run.device_used ?? "CPU"}</td>
                  <td>
                    <button className="icon-button small" title="Delete run" onClick={() => onDelete(run.run_id)}>
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {runs.length === 0 ? <p className="empty-note">Runs will capture parameters, metrics, artifacts, plots, generated PyTorch code, checkpoints, and training curves.</p> : null}
        </div>
      </section>

      <section className="panel span-3">
        <h2>Compare</h2>
        <div className="summary-grid">
          <div>
            <strong>Metrics</strong>
            <span>Side-by-side metric comparison is ready for logged runs.</span>
          </div>
          <div>
            <strong>Training curves</strong>
            <span>Epoch metrics from deep learning runs are stored for overlay charts.</span>
          </div>
          <div>
            <strong>Hyperparameters</strong>
            <span>Parameters are captured as JSON per run.</span>
          </div>
          <div>
            <strong>Confusion matrices</strong>
            <span>Classical and PyTorch confusion matrices are tracked as artifacts.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
