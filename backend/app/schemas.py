from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    name: str | None = None


class ExecuteRequest(BaseModel):
    code: str
    timeout: int = Field(default=15, ge=1, le=120)


class ExecuteResponse(BaseModel):
    execution_count: int
    stdout: str = ""
    stderr: str = ""
    duration_ms: float
    outputs: list[dict[str, Any]] = Field(default_factory=list)
    error: dict[str, Any] | None = None


class DatasetSaveRequest(BaseModel):
    rows: list[dict[str, Any]]
    name: str | None = None


class DatasetExportRequest(BaseModel):
    format: Literal["csv", "json", "jsonl", "parquet"] = "csv"


class PlotRequest(BaseModel):
    dataset_id: str
    plot_type: str
    x: str | None = None
    y: str | None = None
    z: str | None = None
    color: str | None = None
    size: str | None = None
    target: str | None = None
    sample_size: int = Field(default=500, ge=10, le=10000)


class DecisionBoundaryRequest(BaseModel):
    dataset_id: str
    session_id: str
    model_name: str
    x_feature: str
    y_feature: str
    target_column: str
    grid_size: int = Field(default=120, ge=30, le=400)


class TrainModelRequest(BaseModel):
    dataset_id: str
    session_id: str | None = None
    algorithm: str = "logistic_regression"
    target_column: str
    feature_columns: list[str]
    model_name: str = "model"
    test_size: float = 0.25
    random_seed: int = 42


class SaveModelRequest(BaseModel):
    session_id: str
    model_name: str
    path: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class LoadModelRequest(BaseModel):
    session_id: str
    path: str
    variable_name: str = "loaded_model"


class ExperimentLogRequest(BaseModel):
    run_name: str
    dataset_used: str | None = None
    notebook_used: str | None = None
    model_type: str | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)
    metrics: dict[str, Any] = Field(default_factory=dict)
    artifacts: list[str] = Field(default_factory=list)
    plots: list[dict[str, Any]] = Field(default_factory=list)
    notes: str = ""
    architecture_json: dict[str, Any] | None = None
    generated_pytorch_code: str | None = None
    epoch_metrics: list[dict[str, Any]] = Field(default_factory=list)
    random_seed: int | None = None
    device_used: str | None = None


class ArchitectureRequest(BaseModel):
    architecture: dict[str, Any]


class DeepLearningTrainRequest(BaseModel):
    dataset_id: str
    architecture: dict[str, Any]
    target_column: str
    feature_columns: list[str]
    session_id: str | None = None
    model_name: str = "torch_model"
    epochs: int = Field(default=25, ge=1, le=500)
    learning_rate: float = Field(default=0.01, gt=0, le=1)
    batch_size: int = Field(default=16, ge=1, le=1024)
    validation_split: float = Field(default=0.2, ge=0.05, le=0.8)
    random_seed: int = 42
