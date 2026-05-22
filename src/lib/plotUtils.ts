import type { DatasetRecord, PlotlyFigure } from "./types";

export function emptyFigure(title = "No data selected"): PlotlyFigure {
  return {
    data: [],
    layout: {
      title,
      template: "plotly_dark",
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)"
    }
  };
}

export function correlationHeatmap(dataset: DatasetRecord): PlotlyFigure {
  const columns = [...new Set(dataset.correlations.map((item) => item.x))];
  const matrix = columns.map((y) =>
    columns.map((x) => dataset.correlations.find((item) => item.x === x && item.y === y)?.value ?? null)
  );
  return {
    data: [
      {
        type: "heatmap",
        x: columns,
        y: columns,
        z: matrix,
        colorscale: "RdBu",
        zmin: -1,
        zmax: 1
      }
    ],
    layout: {
      title: "Correlation matrix",
      template: "plotly_dark",
      margin: { l: 56, r: 16, t: 42, b: 48 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)"
    }
  };
}

export function classDistributionFigure(dataset: DatasetRecord, column: string): PlotlyFigure {
  const values = dataset.class_distribution[column] ?? {};
  return {
    data: [{ type: "bar", x: Object.keys(values), y: Object.values(values), marker: { color: "#45b8ac" } }],
    layout: {
      title: `Class balance: ${column}`,
      template: "plotly_dark",
      margin: { l: 48, r: 16, t: 42, b: 64 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)"
    }
  };
}
