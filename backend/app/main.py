from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .datasets import DatasetManager
from .deep_learning import generate_code, model_summary_from_session, torch_status, train_mlp, validate
from .experiments import ExperimentTracker
from .models import ModelRegistry
from .model_inspection import activation_placeholder, weights_for_model
from .plotting import create_plot, decision_boundary
from .schemas import (
    ArchitectureRequest,
    DatasetExportRequest,
    DatasetSaveRequest,
    DecisionBoundaryRequest,
    DeepLearningTrainRequest,
    ExecuteRequest,
    ExperimentLogRequest,
    LoadModelRequest,
    PlotRequest,
    SaveModelRequest,
    SessionCreate,
    TrainModelRequest,
)
from .sessions import SessionManager
from .storage import ensure_project, new_id


app = FastAPI(
    title="ML Lab Studio Backend",
    version="0.1.0",
    description="Local trusted FastAPI sidecar for ML Lab Studio notebook execution, datasets, models, and visualization.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "tauri://localhost", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions = SessionManager()
datasets = DatasetManager()
models = ModelRegistry()
experiments = ExperimentTracker()


def raise_http(exc: Exception) -> None:
    if isinstance(exc, KeyError):
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "name": "ML Lab Studio Backend",
        "version": "0.1.0",
        "trusted_local_code": True,
        "warning": "Notebook code runs locally in a trusted Python session. Do not run untrusted code.",
        "torch": torch_status(),
    }


@app.post("/projects/create")
def create_project(payload: dict[str, Any]) -> dict[str, Any]:
    project_path = Path(payload.get("path", ".")).expanduser().resolve()
    return ensure_project(project_path, payload.get("name", "ML Lab Studio Project"))


@app.post("/sessions")
def create_session(payload: SessionCreate) -> dict[str, Any]:
    session_id = new_id("session")
    session = sessions.create(session_id, payload.name or "Notebook")
    return {"session_id": session.id, "name": session.name}


@app.delete("/sessions/{session_id}")
def delete_session(session_id: str) -> dict[str, Any]:
    return {"deleted": sessions.delete(session_id)}


@app.post("/sessions/{session_id}/execute")
def execute(session_id: str, payload: ExecuteRequest) -> dict[str, Any]:
    try:
        return sessions.execute(session_id, payload.code, payload.timeout)
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/sessions/{session_id}/interrupt")
def interrupt(session_id: str) -> dict[str, Any]:
    try:
        return sessions.interrupt(session_id)
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.get("/sessions/{session_id}/variables")
def variables(session_id: str) -> dict[str, Any]:
    try:
        return {"variables": sessions.variables(session_id)}
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/datasets/import")
async def import_dataset(file: UploadFile = File(...)) -> dict[str, Any]:
    try:
        return datasets.import_bytes(file.filename or "dataset.csv", await file.read())
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str) -> dict[str, Any]:
    try:
        return datasets.describe(dataset_id)
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/datasets/{dataset_id}/save")
def save_dataset(dataset_id: str, payload: DatasetSaveRequest) -> dict[str, Any]:
    try:
        return datasets.save(dataset_id, payload.rows, payload.name)
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/datasets/{dataset_id}/export")
def export_dataset(dataset_id: str, payload: DatasetExportRequest) -> dict[str, Any]:
    try:
        return datasets.export(dataset_id, payload.format)
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/visualize/plot")
def visualize_plot(payload: PlotRequest) -> dict[str, Any]:
    try:
        return create_plot(datasets, payload.model_dump())
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/visualize/decision-boundary")
def visualize_decision_boundary(payload: DecisionBoundaryRequest) -> dict[str, Any]:
    try:
        return decision_boundary(datasets, sessions, payload.model_dump())
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/models/train")
def train_model(payload: TrainModelRequest) -> dict[str, Any]:
    try:
        from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
        from sklearn.linear_model import LogisticRegression, LinearRegression
        from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, r2_score
        from sklearn.model_selection import train_test_split
        from sklearn.neighbors import KNeighborsClassifier
        from sklearn.svm import SVC

        df = datasets.get(payload.dataset_id).dropna(subset=payload.feature_columns + [payload.target_column])
        X = df[payload.feature_columns]
        y = df[payload.target_column]
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=payload.test_size,
            random_state=payload.random_seed,
            stratify=y if y.nunique() > 1 and min(y.value_counts()) > 1 else None,
        )
        algorithms = {
            "logistic_regression": LogisticRegression(max_iter=500),
            "random_forest": RandomForestClassifier(random_state=payload.random_seed),
            "svm": SVC(probability=True),
            "knn": KNeighborsClassifier(),
            "gradient_boosting": GradientBoostingClassifier(random_state=payload.random_seed),
            "regression": LinearRegression(),
        }
        model = algorithms.get(payload.algorithm, algorithms["logistic_regression"])
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        if payload.algorithm == "regression":
            metrics = {"r2": float(r2_score(y_test, predictions))}
            report = {}
            matrix = []
        else:
            metrics = {"accuracy": float(accuracy_score(y_test, predictions))}
            report = classification_report(y_test, predictions, output_dict=True)
            matrix = confusion_matrix(y_test, predictions).tolist()
        if payload.session_id:
            session = sessions.get(payload.session_id)
            session.namespace[payload.model_name] = model
        return {"model_name": payload.model_name, "metrics": metrics, "classification_report": report, "confusion_matrix": matrix}
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/models/predict")
def predict_model(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        session = sessions.get(payload["session_id"])
        model = session.namespace[payload["model_name"]]
        rows = payload.get("rows", [])
        return {"predictions": model.predict(rows).tolist()}
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/models/save")
def save_model(payload: SaveModelRequest) -> dict[str, Any]:
    try:
        session = sessions.get(payload.session_id)
        return models.save(session.namespace, payload.model_name, payload.path, payload.metadata)
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/models/load")
def load_model(payload: LoadModelRequest) -> dict[str, Any]:
    try:
        session = sessions.get(payload.session_id)
        return models.load(session.namespace, payload.path, payload.variable_name)
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.get("/models")
def list_models() -> dict[str, Any]:
    return {"models": models.list()}


@app.delete("/models/{model_id}")
def delete_model(model_id: str) -> dict[str, Any]:
    return {"deleted": models.delete(model_id)}


@app.post("/experiments/log")
def log_experiment(payload: ExperimentLogRequest) -> dict[str, Any]:
    return experiments.log(payload.model_dump())


@app.get("/experiments")
def list_experiments() -> dict[str, Any]:
    return {"runs": experiments.list()}


@app.get("/experiments/{run_id}")
def get_experiment(run_id: str) -> dict[str, Any]:
    try:
        return experiments.get(run_id)
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.delete("/experiments/{run_id}")
def delete_experiment(run_id: str) -> dict[str, Any]:
    return {"deleted": experiments.delete(run_id)}


@app.post("/deep-learning/architectures/validate")
def dl_validate(payload: ArchitectureRequest) -> dict[str, Any]:
    return validate(payload.model_dump())


@app.post("/deep-learning/architectures/generate-code")
def dl_generate_code(payload: ArchitectureRequest) -> dict[str, Any]:
    try:
        return generate_code(payload.model_dump())
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/deep-learning/train")
def dl_train(payload: DeepLearningTrainRequest) -> dict[str, Any]:
    try:
        return train_mlp(datasets, sessions, payload.model_dump())
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/deep-learning/evaluate")
def dl_evaluate(payload: dict[str, Any]) -> dict[str, Any]:
    return {"status": "placeholder", "message": "Evaluation endpoint is ready for model-specific evaluators.", "request": payload}


@app.post("/deep-learning/predict")
def dl_predict(payload: dict[str, Any]) -> dict[str, Any]:
    return predict_model(payload)


@app.post("/deep-learning/model-summary")
def dl_model_summary(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        return model_summary_from_session(sessions, payload["session_id"], payload["model_name"])
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/deep-learning/weights")
def dl_weights(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        return weights_for_model(sessions, payload["session_id"], payload["model_name"])
    except Exception as exc:  # noqa: BLE001
        raise_http(exc)


@app.post("/deep-learning/activations")
def dl_activations() -> dict[str, Any]:
    return activation_placeholder()


@app.post("/deep-learning/gradients")
def dl_gradients() -> dict[str, Any]:
    return {"status": "placeholder", "message": "Gradient capture is planned with PyTorch hooks."}


@app.post("/deep-learning/save-checkpoint")
def dl_save_checkpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return save_model(
        SaveModelRequest(
            session_id=payload["session_id"],
            model_name=payload["model_name"],
            path=payload.get("path"),
            metadata={**payload.get("metadata", {}), "framework": "PyTorch"},
        )
    )


@app.post("/deep-learning/load-checkpoint")
def dl_load_checkpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return load_model(LoadModelRequest(session_id=payload["session_id"], path=payload["path"], variable_name=payload.get("variable_name", "loaded_model")))


@app.get("/deep-learning/devices")
def dl_devices() -> dict[str, Any]:
    return torch_status()
