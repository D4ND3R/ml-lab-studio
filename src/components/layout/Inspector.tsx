import { Activity, Braces, Database, Info, Layers, Scale3d } from "lucide-react";

import type { DatasetRecord, NetworkArchitecture, TrainingResult, VariableInfo } from "../../lib/types";

type Props = {
  dataset: DatasetRecord | null;
  variables: VariableInfo[];
  architecture: NetworkArchitecture;
  training: TrainingResult | null;
};

export function Inspector({ dataset, variables, architecture, training }: Props) {
  const modelVariables = variables.filter((item) => item.capabilities.includes("predict") || item.capabilities.includes("torch_module"));
  return (
    <aside className="inspector">
      <section className="inspector-section">
        <h2>
          <Info size={16} aria-hidden="true" />
          Inspector
        </h2>
        <p className="small">
          Local notebook execution is trusted. Keep imported code and notebooks from sources you control.
        </p>
      </section>

      <section className="inspector-section">
        <h3>
          <Database size={15} aria-hidden="true" />
          Dataset schema
        </h3>
        {dataset ? (
          <div className="schema-list">
            {dataset.schema.slice(0, 10).map((column) => (
              <div key={column.name} className="schema-row">
                <span>{column.name}</span>
                <small>{column.semantic_type}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-note">No dataset selected.</p>
        )}
      </section>

      <section className="inspector-section">
        <h3>
          <Braces size={15} aria-hidden="true" />
          Notebook variables
        </h3>
        <div className="variable-list compact">
          {variables.slice(0, 12).map((variable) => (
            <div key={variable.name} className="variable-row">
              <strong>{variable.name}</strong>
              <span>{variable.type}</span>
            </div>
          ))}
          {variables.length === 0 ? <p className="empty-note">Run a cell to populate variables.</p> : null}
        </div>
      </section>

      <section className="inspector-section">
        <h3>
          <Layers size={15} aria-hidden="true" />
          Architecture
        </h3>
        <dl className="metric-grid">
          <div>
            <dt>Input</dt>
            <dd>{architecture.inputSize}</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>{architecture.outputSize}</dd>
          </div>
          <div>
            <dt>Layers</dt>
            <dd>{architecture.layers.length}</dd>
          </div>
          <div>
            <dt>Optimizer</dt>
            <dd>{architecture.optimizer}</dd>
          </div>
        </dl>
      </section>

      <section className="inspector-section">
        <h3>
          <Activity size={15} aria-hidden="true" />
          Training metrics
        </h3>
        {training?.metrics ? (
          <dl className="metric-grid">
            {Object.entries(training.metrics).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{Number(value).toFixed(3)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="empty-note">No training run yet.</p>
        )}
      </section>

      <section className="inspector-section">
        <h3>
          <Scale3d size={15} aria-hidden="true" />
          Model variables
        </h3>
        {modelVariables.map((variable) => (
          <div key={variable.name} className="schema-row">
            <span>{variable.name}</span>
            <small>{variable.framework ?? variable.type}</small>
          </div>
        ))}
        {modelVariables.length === 0 ? <p className="empty-note">No model variables detected.</p> : null}
      </section>
    </aside>
  );
}
