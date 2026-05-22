import Plot from "react-plotly.js";

import type { PlotlyFigure } from "../../lib/types";

type Props = {
  figure: PlotlyFigure;
  title?: string;
};

export function PlotPanel({ figure, title }: Props) {
  return (
    <div className="plot-panel">
      {title ? <h3>{title}</h3> : null}
      <Plot
        data={figure.data ?? []}
        layout={{
          autosize: true,
          template: "plotly_dark",
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "#d8dee9" },
          margin: { l: 44, r: 18, t: 42, b: 44 },
          ...(figure.layout ?? {})
        }}
        frames={figure.frames}
        useResizeHandler
        config={{ displaylogo: false, responsive: true }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
