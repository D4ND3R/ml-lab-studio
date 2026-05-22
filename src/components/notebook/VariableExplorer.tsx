import { Box, Eye } from "lucide-react";

import type { VariableInfo } from "../../lib/types";

type Props = {
  variables: VariableInfo[];
  onVisualize?: (variable: VariableInfo) => void;
};

export function VariableExplorer({ variables, onVisualize }: Props) {
  return (
    <div className="variable-list">
      {variables.map((variable) => (
        <div key={variable.name} className="variable-card">
          <div>
            <strong>{variable.name}</strong>
            <span>{variable.type}{variable.shape ? ` ${variable.shape.join(" x ")}` : ""}</span>
          </div>
          <div className="capability-row">
            {variable.capabilities.map((capability) => (
              <small key={capability}>{capability}</small>
            ))}
          </div>
          {variable.capabilities.includes("predict") || variable.capabilities.includes("torch_module") ? (
            <button onClick={() => onVisualize?.(variable)}>
              {variable.capabilities.includes("torch_module") ? <Box size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
              Visualize
            </button>
          ) : null}
        </div>
      ))}
      {variables.length === 0 ? <p className="empty-note">No variables yet.</p> : null}
    </div>
  );
}
