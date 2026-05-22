import type { NetworkArchitecture, NetworkLayer } from "../../lib/types";

function layerUnits(layer: NetworkLayer, fallback: number): number {
  if (layer.type === "linear") {
    return Math.min(layer.units ?? fallback, 12);
  }
  return Math.min(fallback, 12);
}

function estimateParameters(architecture: NetworkArchitecture): number {
  let total = 0;
  let previous = architecture.inputSize;
  for (const layer of architecture.layers) {
    if (layer.type === "linear") {
      const units = layer.units ?? architecture.outputSize;
      total += previous * units + units;
      previous = units;
    }
    if (layer.type === "batchnorm1d") {
      total += previous * 2;
    }
  }
  return total;
}

type Props = {
  architecture: NetworkArchitecture;
  mode?: "architecture" | "perceptron" | "training" | "gradient" | "activation";
};

export function NetworkVisualizer({ architecture, mode = "architecture" }: Props) {
  const drawableLayers = [
    { id: "input", type: "input", label: "Input", units: architecture.inputSize },
    ...architecture.layers.filter((layer) => !layer.placeholder),
    { id: "output", type: "output", label: "Output", units: architecture.outputSize }
  ];
  const width = 880;
  const height = 420;
  const gap = width / Math.max(drawableLayers.length - 1, 1);
  const totalParams = estimateParameters(architecture);

  return (
    <div className="visualizer-shell">
      <div className="panel-title">
        <h2>Neural Network Visualizer</h2>
        <span className="status-pill">{mode}</span>
      </div>
      <svg className="network-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Neural network architecture">
        {drawableLayers.map((layer, layerIndex) => {
          if (layerIndex === drawableLayers.length - 1) {
            return null;
          }
          const currentUnits = layerUnits(layer as NetworkLayer, Number(layer.units ?? architecture.inputSize));
          const next = drawableLayers[layerIndex + 1];
          const nextUnits = layerUnits(next as NetworkLayer, Number(next.units ?? architecture.outputSize));
          const x1 = layerIndex * gap + 24;
          const x2 = (layerIndex + 1) * gap + 24;
          return Array.from({ length: currentUnits }).flatMap((_, sourceIndex) =>
            Array.from({ length: nextUnits }).map((__, targetIndex) => {
              const y1 = ((sourceIndex + 1) * height) / (currentUnits + 1);
              const y2 = ((targetIndex + 1) * height) / (nextUnits + 1);
              return <line key={`${layerIndex}-${sourceIndex}-${targetIndex}`} x1={x1} y1={y1} x2={x2} y2={y2} className="connection-line" />;
            })
          );
        })}
        {drawableLayers.map((layer, layerIndex) => {
          const units = layerUnits(layer as NetworkLayer, Number(layer.units ?? architecture.outputSize));
          const x = layerIndex * gap + 24;
          return (
            <g key={layer.id}>
              {Array.from({ length: units }).map((_, neuronIndex) => {
                const y = ((neuronIndex + 1) * height) / (units + 1);
                return <circle key={neuronIndex} cx={x} cy={y} r={10} className={layer.type === "output" ? "neuron output" : "neuron"} />;
              })}
              <text x={x} y={20} className="svg-label" textAnchor="middle">
                {layer.label ?? layer.type}
              </text>
              <text x={x} y={height - 12} className="svg-small" textAnchor="middle">
                {Number(layer.units ?? units)} units
              </text>
            </g>
          );
        })}
      </svg>
      <dl className="metric-grid wide">
        <div>
          <dt>Trainable parameters</dt>
          <dd>{totalParams.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Small-network view</dt>
          <dd>{totalParams < 2000 ? "Perceptrons" : "Collapsed"}</dd>
        </div>
        <div>
          <dt>Modes</dt>
          <dd>architecture, perceptron, training, gradient, activation</dd>
        </div>
      </dl>
    </div>
  );
}
