import type { LucideIcon } from "lucide-react";

export type SectionId =
  | "projects"
  | "datasets"
  | "explorer"
  | "notebooks"
  | "deep-learning"
  | "models"
  | "experiments"
  | "settings";

export type SidebarItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

export type BackendHealth = {
  ok: boolean;
  name: string;
  version: string;
  warning: string;
  torch: DeviceStatus;
};

export type DeviceStatus = {
  torch_available: boolean;
  devices: string[];
  active: string;
  install_command: string;
  warning?: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  settings: Record<string, unknown>;
};

export type DatasetSchemaColumn = {
  name: string;
  dtype: string;
  semantic_type: "numeric" | "categorical" | "datetime" | "text" | "image";
  missing: number;
  unique: number;
};

export type DatasetRecord = {
  id: string;
  name: string;
  format: string;
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[];
  schema: DatasetSchemaColumn[];
  stats: Record<string, unknown>[];
  missing: { column: string; missing: number; percent: number }[];
  duplicate_rows: number;
  correlations: { x: string; y: string; value: number | null }[];
  class_distribution: Record<string, Record<string, number>>;
};

export type NotebookOutput =
  | { type: "dataframe"; shape: [number, number]; columns: string[]; rows: Record<string, unknown>[] }
  | { type: "plotly"; figure: PlotlyFigure; warning?: string }
  | { type: "image"; mime: string; data: string }
  | { type: "value"; value: unknown; repr: string }
  | { type: "text"; text: string };

export type NotebookError = {
  ename: string;
  evalue: string;
  traceback: string;
};

export type NotebookCell = {
  id: string;
  kind: "code" | "markdown";
  source: string;
  outputs: NotebookOutput[];
  stdout?: string;
  stderr?: string;
  error?: NotebookError | null;
  executionCount?: number;
  durationMs?: number;
};

export type NotebookFile = {
  name: string;
  version: "0.1.0";
  cells: NotebookCell[];
  createdAt: string;
  updatedAt: string;
};

export type VariableInfo = {
  name: string;
  type: string;
  repr: string;
  shape?: number[];
  columns?: string[];
  framework?: string;
  capabilities: string[];
};

export type PlotlyFigure = {
  data?: unknown[];
  layout?: Record<string, unknown>;
  frames?: unknown[];
};

export type TemplateSnippet = {
  id: string;
  title: string;
  category: "Classical ML" | "Deep Learning" | "Visualization" | "Data Prep";
  code: string;
};

export type NetworkLayerType =
  | "linear"
  | "relu"
  | "sigmoid"
  | "tanh"
  | "softmax"
  | "dropout"
  | "batchnorm1d"
  | "flatten"
  | "conv2d"
  | "maxpool2d"
  | "lstm"
  | "gru"
  | "transformer"
  | "embedding";

export type NetworkLayer = {
  id: string;
  type: NetworkLayerType;
  units?: number;
  rate?: number;
  label?: string;
  placeholder?: boolean;
};

export type NetworkArchitecture = {
  name: string;
  inputSize: number;
  outputSize: number;
  layers: NetworkLayer[];
  loss: string;
  optimizer: string;
  learningRate: number;
  batchSize: number;
  epochs: number;
  validationSplit: number;
};

export type TrainingHistoryPoint = {
  epoch: number;
  train_loss: number;
  val_loss: number;
  accuracy?: number;
  f1?: number;
  learning_rate?: number;
};

export type TrainingResult = {
  ok: boolean;
  error?: string;
  model_name?: string;
  history?: TrainingHistoryPoint[];
  metrics?: Record<string, number>;
  confusion_matrix?: number[][];
  device?: string;
  class_names?: string[];
  weights?: WeightSummary[];
};

export type WeightSummary = {
  name: string;
  shape: number[];
  mean: number;
  std: number;
  min: number;
  max: number;
  sample: number[];
};

export type ExperimentRun = {
  run_id: string;
  timestamp: string;
  run_name: string;
  dataset_used?: string;
  notebook_used?: string;
  model_type?: string;
  parameters: Record<string, unknown>;
  metrics: Record<string, unknown>;
  notes: string;
  device_used?: string;
  epoch_metrics?: TrainingHistoryPoint[];
};

export type ModelCard = {
  id: string;
  name: string;
  path: string;
  format: string;
  created_date: string;
  framework: string;
  algorithm: string;
  dataset?: string;
  target_column?: string;
  features?: string[];
  metrics?: Record<string, unknown>;
  notes?: string;
  device_used?: string;
};
