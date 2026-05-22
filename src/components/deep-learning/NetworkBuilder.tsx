import { CopyPlus, Plus, Trash2 } from "lucide-react";

import type { NetworkArchitecture, NetworkLayer, NetworkLayerType } from "../../lib/types";

const layerOptions: { type: NetworkLayerType; label: string; placeholder?: boolean }[] = [
  { type: "linear", label: "Linear / Dense" },
  { type: "relu", label: "ReLU" },
  { type: "sigmoid", label: "Sigmoid" },
  { type: "tanh", label: "Tanh" },
  { type: "softmax", label: "Softmax" },
  { type: "dropout", label: "Dropout" },
  { type: "batchnorm1d", label: "BatchNorm1d" },
  { type: "flatten", label: "Flatten" },
  { type: "conv2d", label: "Conv2D", placeholder: true },
  { type: "maxpool2d", label: "MaxPool2D", placeholder: true },
  { type: "lstm", label: "LSTM", placeholder: true },
  { type: "gru", label: "GRU", placeholder: true },
  { type: "transformer", label: "Transformer encoder", placeholder: true },
  { type: "embedding", label: "Embedding", placeholder: true }
];

type Props = {
  architecture: NetworkArchitecture;
  onChange: (architecture: NetworkArchitecture) => void;
  onGenerateCode: () => void;
  onTrain: () => void;
};

function updateLayer(layer: NetworkLayer, patch: Partial<NetworkLayer>): NetworkLayer {
  return { ...layer, ...patch, label: patch.label ?? layer.label };
}

export function NetworkBuilder({ architecture, onChange, onGenerateCode, onTrain }: Props) {
  function addLayer(type: NetworkLayerType) {
    const option = layerOptions.find((item) => item.type === type);
    const layer: NetworkLayer = {
      id: crypto.randomUUID(),
      type,
      label: option?.label ?? type,
      units: type === "linear" ? architecture.outputSize : undefined,
      rate: type === "dropout" ? 0.2 : undefined,
      placeholder: option?.placeholder
    };
    onChange({ ...architecture, layers: [...architecture.layers, layer] });
  }

  function setLayer(index: number, patch: Partial<NetworkLayer>) {
    onChange({
      ...architecture,
      layers: architecture.layers.map((layer, layerIndex) => (layerIndex === index ? updateLayer(layer, patch) : layer))
    });
  }

  function deleteLayer(index: number) {
    onChange({ ...architecture, layers: architecture.layers.filter((_, layerIndex) => layerIndex !== index) });
  }

  return (
    <div className="builder-grid">
      <section className="panel">
        <div className="panel-title">
          <h2>Neural Network Builder</h2>
          <div className="toolbar">
            <button onClick={onGenerateCode}>
              <CopyPlus size={15} aria-hidden="true" />
              Generate PyTorch
            </button>
            <button className="primary-button" onClick={onTrain}>
              Train Iris MLP
            </button>
          </div>
        </div>
        <div className="form-grid four">
          <label>
            Name
            <input value={architecture.name} onChange={(event) => onChange({ ...architecture, name: event.target.value })} />
          </label>
          <label>
            Input size
            <input type="number" min={1} value={architecture.inputSize} onChange={(event) => onChange({ ...architecture, inputSize: Number(event.target.value) })} />
          </label>
          <label>
            Output size
            <input type="number" min={1} value={architecture.outputSize} onChange={(event) => onChange({ ...architecture, outputSize: Number(event.target.value) })} />
          </label>
          <label>
            Loss
            <select value={architecture.loss} onChange={(event) => onChange({ ...architecture, loss: event.target.value })}>
              <option>CrossEntropyLoss</option>
              <option>BCEWithLogitsLoss</option>
              <option>MSELoss</option>
            </select>
          </label>
          <label>
            Optimizer
            <select value={architecture.optimizer} onChange={(event) => onChange({ ...architecture, optimizer: event.target.value })}>
              <option>Adam</option>
              <option>SGD</option>
              <option>RMSprop</option>
            </select>
          </label>
          <label>
            Learning rate
            <input type="number" min={0.0001} step={0.0001} value={architecture.learningRate} onChange={(event) => onChange({ ...architecture, learningRate: Number(event.target.value) })} />
          </label>
          <label>
            Batch size
            <input type="number" min={1} value={architecture.batchSize} onChange={(event) => onChange({ ...architecture, batchSize: Number(event.target.value) })} />
          </label>
          <label>
            Epochs
            <input type="number" min={1} value={architecture.epochs} onChange={(event) => onChange({ ...architecture, epochs: Number(event.target.value) })} />
          </label>
        </div>

        <div className="layer-list">
          {architecture.layers.map((layer, index) => (
            <div key={layer.id} className={layer.placeholder ? "layer-row placeholder" : "layer-row"}>
              <strong>{index + 1}</strong>
              <select value={layer.type} onChange={(event) => setLayer(index, { type: event.target.value as NetworkLayerType })}>
                {layerOptions.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.label}
                  </option>
                ))}
              </select>
              {layer.type === "linear" ? (
                <label>
                  Units
                  <input type="number" min={1} value={layer.units ?? 8} onChange={(event) => setLayer(index, { units: Number(event.target.value) })} />
                </label>
              ) : null}
              {layer.type === "dropout" ? (
                <label>
                  Rate
                  <input type="number" min={0} max={0.95} step={0.05} value={layer.rate ?? 0.2} onChange={(event) => setLayer(index, { rate: Number(event.target.value) })} />
                </label>
              ) : null}
              {layer.placeholder ? <span className="warning-chip">future-ready</span> : null}
              <button className="icon-button small" title="Delete layer" onClick={() => deleteLayer(index)}>
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Add Layer</h2>
        <div className="layer-option-grid">
          {layerOptions.map((option) => (
            <button key={option.type} className={option.placeholder ? "placeholder" : ""} onClick={() => addLayer(option.type)}>
              <Plus size={15} aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
