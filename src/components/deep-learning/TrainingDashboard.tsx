import { Pause, Save, Square } from "lucide-react";

import type { PlotlyFigure, TrainingResult } from "../../lib/types";
import { PlotPanel } from "../plots/PlotPanel";

type Props = {
  result: TrainingResult | null;
};

function historyFigure(result: TrainingResult | null): PlotlyFigure {
  const history = result?.history ?? [];
  return {
    data: [
      { type: "scatter", mode: "lines+markers", x: history.map((row) => row.epoch), y: history.map((row) => row.train_loss), name: "Training loss" },
      { type: "scatter", mode: "lines+markers", x: history.map((row) => row.epoch), y: history.map((row) => row.val_loss), name: "Validation loss" },
      { type: "scatter", mode: "lines+markers", x: history.map((row) => row.epoch), y: history.map((row) => row.accuracy), name: "Accuracy", yaxis: "y2" }
    ],
    layout: {
      title: "Training curves",
      yaxis: { title: "Loss" },
      yaxis2: { title: "Accuracy", overlaying: "y", side: "right", range: [0, 1] }
    }
  };
}

function confusionFigure(result: TrainingResult | null): PlotlyFigure {
  const matrix = result?.confusion_matrix ?? [];
  return {
    data: [{ type: "heatmap", z: matrix, colorscale: "Viridis", x: result?.class_names, y: result?.class_names }],
    layout: { title: "Confusion matrix" }
  };
}

export function TrainingDashboard({ result }: Props) {
  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="panel-title">
          <h2>Training Dashboard</h2>
          <div className="toolbar">
            <button>
              <Pause size={15} aria-hidden="true" />
              Pause
            </button>
            <button>
              <Square size={15} aria-hidden="true" />
              Stop
            </button>
            <button>
              <Save size={15} aria-hidden="true" />
              Checkpoint
            </button>
          </div>
        </div>
        {result?.error ? <div className="warning-banner">{result.error}</div> : null}
        <dl className="metric-grid wide">
          <div>
            <dt>Device</dt>
            <dd>{result?.device ?? "CPU"}</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>{result?.metrics?.accuracy?.toFixed(3) ?? "pending"}</dd>
          </div>
          <div>
            <dt>F1</dt>
            <dd>{result?.metrics?.f1?.toFixed(3) ?? "pending"}</dd>
          </div>
          <div>
            <dt>Epochs</dt>
            <dd>{result?.history?.length ?? 0}</dd>
          </div>
        </dl>
      </section>
      <PlotPanel figure={historyFigure(result)} />
      <PlotPanel figure={confusionFigure(result)} />
      <section className="panel">
        <h2>Prediction Distribution</h2>
        <p className="empty-note">Probability and prediction distribution views are scaffolded for the next live evaluator pass.</p>
      </section>
    </div>
  );
}
