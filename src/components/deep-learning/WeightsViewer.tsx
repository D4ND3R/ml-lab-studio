import type { TrainingResult, WeightSummary } from "../../lib/types";

type Props = {
  result: TrainingResult | null;
};

function WeightRow({ weight }: { weight: WeightSummary }) {
  return (
    <div className="weight-row">
      <div>
        <strong>{weight.name}</strong>
        <span>{weight.shape.join(" x ")}</span>
      </div>
      <dl className="metric-grid">
        <div>
          <dt>Mean</dt>
          <dd>{weight.mean.toFixed(4)}</dd>
        </div>
        <div>
          <dt>Std</dt>
          <dd>{weight.std.toFixed(4)}</dd>
        </div>
        <div>
          <dt>Min</dt>
          <dd>{weight.min.toFixed(4)}</dd>
        </div>
        <div>
          <dt>Max</dt>
          <dd>{weight.max.toFixed(4)}</dd>
        </div>
      </dl>
      <div className="weight-spark">
        {weight.sample.slice(0, 40).map((value, index) => (
          <span key={index} style={{ height: `${Math.max(8, Math.min(42, Math.abs(value) * 30 + 8))}px` }} title={value.toFixed(4)} />
        ))}
      </div>
    </div>
  );
}

export function WeightsViewer({ result }: Props) {
  const weights = result?.weights ?? [];
  return (
    <section className="panel">
      <h2>Weights Viewer</h2>
      <div className="weight-list">
        {weights.map((weight) => (
          <WeightRow key={weight.name} weight={weight} />
        ))}
        {weights.length === 0 ? <p className="empty-note">Train a PyTorch model to inspect weights, biases, norms, and parameter histograms.</p> : null}
      </div>
    </section>
  );
}
