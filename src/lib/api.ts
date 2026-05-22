import type {
  BackendHealth,
  DatasetRecord,
  DeviceStatus,
  ExperimentRun,
  ModelCard,
  NetworkArchitecture,
  NotebookOutput,
  PlotlyFigure,
  TrainingResult,
  VariableInfo
} from "./types";

export type ExecuteResult = {
  execution_count: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  outputs: NotebookOutput[];
  error?: { ename: string; evalue: string; traceback: string } | null;
};

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8765";

export function getBackendUrl(): string {
  return localStorage.getItem("mlstudio.backendUrl") || DEFAULT_BACKEND_URL;
}

export function setBackendUrl(url: string): void {
  localStorage.setItem("mlstudio.backendUrl", url.replace(/\/$/, ""));
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    throw new Error(detail);
  }
  return body as T;
}

export class BackendClient {
  constructor(private readonly baseUrl = getBackendUrl()) {}

  async health(): Promise<BackendHealth> {
    return parseResponse<BackendHealth>(await fetch(`${this.baseUrl}/health`));
  }

  async createSession(name: string): Promise<{ session_id: string; name: string }> {
    return parseResponse(await fetch(`${this.baseUrl}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    }));
  }

  async execute(sessionId: string, code: string, timeout = 30): Promise<ExecuteResult> {
    return parseResponse(await fetch(`${this.baseUrl}/sessions/${sessionId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, timeout })
    }));
  }

  async interrupt(sessionId: string): Promise<Record<string, unknown>> {
    return parseResponse(await fetch(`${this.baseUrl}/sessions/${sessionId}/interrupt`, { method: "POST" }));
  }

  async variables(sessionId: string): Promise<VariableInfo[]> {
    const body = await parseResponse<{ variables: VariableInfo[] }>(await fetch(`${this.baseUrl}/sessions/${sessionId}/variables`));
    return body.variables;
  }

  async importDataset(file: File): Promise<DatasetRecord> {
    const form = new FormData();
    form.append("file", file);
    return parseResponse<DatasetRecord>(await fetch(`${this.baseUrl}/datasets/import`, { method: "POST", body: form }));
  }

  async importDatasetFromText(name: string, content: string, type = "text/csv"): Promise<DatasetRecord> {
    return this.importDataset(new File([content], name, { type }));
  }

  async getDataset(datasetId: string): Promise<DatasetRecord> {
    return parseResponse<DatasetRecord>(await fetch(`${this.baseUrl}/datasets/${datasetId}`));
  }

  async saveDataset(datasetId: string, rows: Record<string, unknown>[], name?: string): Promise<DatasetRecord> {
    return parseResponse<DatasetRecord>(await fetch(`${this.baseUrl}/datasets/${datasetId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, name })
    }));
  }

  async exportDataset(datasetId: string, format: "csv" | "json" | "jsonl" | "parquet"): Promise<{ format: string; mime: string; content: string }> {
    return parseResponse(await fetch(`${this.baseUrl}/datasets/${datasetId}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format })
    }));
  }

  async plot(payload: Record<string, unknown>): Promise<{ type: "plotly"; figure: PlotlyFigure; warning?: string }> {
    return parseResponse(await fetch(`${this.baseUrl}/visualize/plot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }));
  }

  async decisionBoundary(payload: Record<string, unknown>): Promise<{ type: "plotly"; figure: PlotlyFigure; warning?: string }> {
    return parseResponse(await fetch(`${this.baseUrl}/visualize/decision-boundary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }));
  }

  async trainModel(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return parseResponse(await fetch(`${this.baseUrl}/models/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }));
  }

  async listModels(): Promise<ModelCard[]> {
    const body = await parseResponse<{ models: ModelCard[] }>(await fetch(`${this.baseUrl}/models`));
    return body.models;
  }

  async saveModel(payload: Record<string, unknown>): Promise<ModelCard> {
    return parseResponse(await fetch(`${this.baseUrl}/models/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }));
  }

  async listExperiments(): Promise<ExperimentRun[]> {
    const body = await parseResponse<{ runs: ExperimentRun[] }>(await fetch(`${this.baseUrl}/experiments`));
    return body.runs;
  }

  async logExperiment(payload: Record<string, unknown>): Promise<ExperimentRun> {
    return parseResponse(await fetch(`${this.baseUrl}/experiments/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }));
  }

  async devices(): Promise<DeviceStatus> {
    return parseResponse<DeviceStatus>(await fetch(`${this.baseUrl}/deep-learning/devices`));
  }

  async validateArchitecture(architecture: NetworkArchitecture): Promise<Record<string, unknown>> {
    return parseResponse(await fetch(`${this.baseUrl}/deep-learning/architectures/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ architecture })
    }));
  }

  async generateArchitectureCode(architecture: NetworkArchitecture): Promise<string> {
    const body = await parseResponse<{ code: string }>(await fetch(`${this.baseUrl}/deep-learning/architectures/generate-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ architecture })
    }));
    return body.code;
  }

  async trainDeepLearning(payload: Record<string, unknown>): Promise<TrainingResult> {
    return parseResponse<TrainingResult>(await fetch(`${this.baseUrl}/deep-learning/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }));
  }

  async modelWeights(payload: Record<string, unknown>): Promise<{ model_name: string; weights: unknown[] }> {
    return parseResponse(await fetch(`${this.baseUrl}/deep-learning/weights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }));
  }
}
