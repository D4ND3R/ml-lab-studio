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

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 10000): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await parseResponse<T>(await fetch(url, { ...init, signal: controller.signal }));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Backend request timed out. The local backend may still be starting.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export class BackendClient {
  constructor(private readonly baseUrl = getBackendUrl()) {}

  private request<T>(path: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    return fetchJson<T>(`${this.baseUrl}${path}`, init, timeoutMs);
  }

  async health(): Promise<BackendHealth> {
    return this.request<BackendHealth>("/health", undefined, 2500);
  }

  async createSession(name: string): Promise<{ session_id: string; name: string }> {
    return this.request("/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
  }

  async execute(sessionId: string, code: string, timeout = 30): Promise<ExecuteResult> {
    return this.request(`/sessions/${sessionId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, timeout })
    }, (timeout + 3) * 1000);
  }

  async interrupt(sessionId: string): Promise<Record<string, unknown>> {
    return this.request(`/sessions/${sessionId}/interrupt`, { method: "POST" });
  }

  async variables(sessionId: string): Promise<VariableInfo[]> {
    const body = await this.request<{ variables: VariableInfo[] }>(`/sessions/${sessionId}/variables`);
    return body.variables;
  }

  async importDataset(file: File): Promise<DatasetRecord> {
    const form = new FormData();
    form.append("file", file);
    return this.request<DatasetRecord>("/datasets/import", { method: "POST", body: form }, 30000);
  }

  async importDatasetFromText(name: string, content: string, type = "text/csv"): Promise<DatasetRecord> {
    return this.importDataset(new File([content], name, { type }));
  }

  async getDataset(datasetId: string): Promise<DatasetRecord> {
    return this.request<DatasetRecord>(`/datasets/${datasetId}`);
  }

  async saveDataset(datasetId: string, rows: Record<string, unknown>[], name?: string): Promise<DatasetRecord> {
    return this.request<DatasetRecord>(`/datasets/${datasetId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, name })
    }, 30000);
  }

  async exportDataset(datasetId: string, format: "csv" | "json" | "jsonl" | "parquet"): Promise<{ format: string; mime: string; content: string }> {
    return this.request(`/datasets/${datasetId}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format })
    }, 30000);
  }

  async plot(payload: Record<string, unknown>): Promise<{ type: "plotly"; figure: PlotlyFigure; warning?: string }> {
    return this.request("/visualize/plot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  async decisionBoundary(payload: Record<string, unknown>): Promise<{ type: "plotly"; figure: PlotlyFigure; warning?: string }> {
    return this.request("/visualize/decision-boundary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, 30000);
  }

  async trainModel(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.request("/models/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, 30000);
  }

  async listModels(): Promise<ModelCard[]> {
    const body = await this.request<{ models: ModelCard[] }>("/models");
    return body.models;
  }

  async saveModel(payload: Record<string, unknown>): Promise<ModelCard> {
    return this.request("/models/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  async deleteModel(modelId: string): Promise<{ deleted: boolean }> {
    return this.request(`/models/${modelId}`, { method: "DELETE" });
  }

  async listExperiments(): Promise<ExperimentRun[]> {
    const body = await this.request<{ runs: ExperimentRun[] }>("/experiments");
    return body.runs;
  }

  async logExperiment(payload: Record<string, unknown>): Promise<ExperimentRun> {
    return this.request("/experiments/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  async deleteExperiment(runId: string): Promise<{ deleted: boolean }> {
    return this.request(`/experiments/${runId}`, { method: "DELETE" });
  }

  async devices(): Promise<DeviceStatus> {
    return this.request<DeviceStatus>("/deep-learning/devices");
  }

  async validateArchitecture(architecture: NetworkArchitecture): Promise<Record<string, unknown>> {
    return this.request("/deep-learning/architectures/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ architecture })
    });
  }

  async generateArchitectureCode(architecture: NetworkArchitecture): Promise<string> {
    const body = await this.request<{ code: string }>("/deep-learning/architectures/generate-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ architecture })
    });
    return body.code;
  }

  async trainDeepLearning(payload: Record<string, unknown>): Promise<TrainingResult> {
    return this.request<TrainingResult>("/deep-learning/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, 60000);
  }

  async modelWeights(payload: Record<string, unknown>): Promise<{ model_name: string; weights: unknown[] }> {
    return this.request("/deep-learning/weights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
}
