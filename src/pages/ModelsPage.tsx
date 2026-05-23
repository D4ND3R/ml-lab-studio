import { RefreshCw, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import type { ModelCard, VariableInfo } from "../lib/types";

type Props = {
  models: ModelCard[];
  variables: VariableInfo[];
  onRefresh: () => void;
  onSaveModel: (modelName: string) => void;
  onDeleteModel: (modelId: string) => void;
};

export function ModelsPage({ models, variables, onRefresh, onSaveModel, onDeleteModel }: Props) {
  const [modelName, setModelName] = useState("model");
  const modelVariables = variables.filter((variable) => variable.capabilities.includes("predict") || variable.capabilities.includes("torch_module"));
  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-title">
          <h1>Models</h1>
          <button onClick={onRefresh}>
            <RefreshCw size={15} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <div className="form-stack">
          <label>
            Notebook model variable
            <select value={modelName} onChange={(event) => setModelName(event.target.value)}>
              <option>{modelName}</option>
              {modelVariables.map((variable) => (
                <option key={variable.name}>{variable.name}</option>
              ))}
            </select>
          </label>
          <button className="primary-button" onClick={() => onSaveModel(modelName)}>
            <Save size={15} aria-hidden="true" />
            Save model from variable
          </button>
        </div>
      </section>

      <section className="panel span-2">
        <h2>Model cards</h2>
        <div className="model-card-grid">
          {models.map((model) => (
            <article key={model.id} className="model-card">
              <div>
                <strong>{model.name}</strong>
                <span>{model.framework} / {model.algorithm}</span>
              </div>
              <dl className="metric-grid">
                <div>
                  <dt>Dataset</dt>
                  <dd>{model.dataset ?? "unknown"}</dd>
                </div>
                <div>
                  <dt>Device</dt>
                  <dd>{model.device_used ?? "CPU"}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{model.format}</dd>
                </div>
              </dl>
              <small>{model.path}</small>
              <button className="icon-button small" title="Delete model card" onClick={() => onDeleteModel(model.id)}>
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </article>
          ))}
          {models.length === 0 ? <p className="empty-note">Train or save a model to create a local model card.</p> : null}
        </div>
      </section>
    </div>
  );
}
