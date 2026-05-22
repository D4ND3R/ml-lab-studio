import Plot from "react-plotly.js";

import type { NotebookError, NotebookOutput } from "../../lib/types";

type Props = {
  outputs: NotebookOutput[];
  stdout?: string;
  stderr?: string;
  error?: NotebookError | null;
};

export function OutputRenderer({ outputs, stdout, stderr, error }: Props) {
  if (!stdout && !stderr && outputs.length === 0 && !error) {
    return null;
  }

  return (
    <div className="cell-output">
      {stdout ? <pre className="stdout">{stdout}</pre> : null}
      {stderr ? <pre className="stderr">{stderr}</pre> : null}
      {outputs.map((output, index) => {
        if (output.type === "dataframe") {
          return (
            <div className="output-table" key={index}>
              <div className="muted">DataFrame {output.shape[0]} x {output.shape[1]}</div>
              <div className="grid-scroll slim">
                <table className="dataset-table small-table">
                  <thead>
                    <tr>
                      {output.columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {output.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {output.columns.map((column) => (
                          <td key={column}>{String(row[column] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        if (output.type === "plotly") {
          return (
            <div className="inline-plot" key={index}>
              {output.warning ? <div className="warning-banner">{output.warning}</div> : null}
              <Plot
                data={output.figure.data ?? []}
                layout={{ template: "plotly_dark", autosize: true, ...(output.figure.layout ?? {}) }}
                useResizeHandler
                config={{ displaylogo: false, responsive: true }}
                style={{ width: "100%", minHeight: 360 }}
              />
            </div>
          );
        }
        if (output.type === "image") {
          return <img key={index} className="output-image" src={output.data} alt="Notebook output" />;
        }
        if (output.type === "value") {
          return <pre key={index} className="stdout">{typeof output.value === "string" ? output.value : output.repr}</pre>;
        }
        return <pre key={index} className="stdout">{output.text}</pre>;
      })}
      {error ? (
        <div className="error-output">
          <strong>{error.ename}: {error.evalue}</strong>
          <pre>{error.traceback}</pre>
        </div>
      ) : null}
    </div>
  );
}
