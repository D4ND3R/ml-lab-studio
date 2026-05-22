from __future__ import annotations

from typing import Any

from .storage import new_id, utc_now


class ExperimentTracker:
    def __init__(self) -> None:
        self.runs: dict[str, dict[str, Any]] = {}

    def log(self, payload: dict[str, Any]) -> dict[str, Any]:
        run_id = new_id("run")
        run = {
            "run_id": run_id,
            "timestamp": utc_now(),
            "run_name": payload.get("run_name", run_id),
            "dataset_used": payload.get("dataset_used"),
            "notebook_used": payload.get("notebook_used"),
            "model_type": payload.get("model_type"),
            "parameters": payload.get("parameters", {}),
            "metrics": payload.get("metrics", {}),
            "artifacts": payload.get("artifacts", []),
            "plots": payload.get("plots", []),
            "notes": payload.get("notes", ""),
            "architecture_json": payload.get("architecture_json"),
            "generated_pytorch_code": payload.get("generated_pytorch_code"),
            "epoch_metrics": payload.get("epoch_metrics", []),
            "final_metrics": payload.get("metrics", {}),
            "training_curves": payload.get("training_curves", []),
            "model_checkpoint_path": payload.get("model_checkpoint_path"),
            "random_seed": payload.get("random_seed"),
            "device_used": payload.get("device_used", "CPU"),
        }
        self.runs[run_id] = run
        return run

    def list(self) -> list[dict[str, Any]]:
        return sorted(self.runs.values(), key=lambda r: r["timestamp"], reverse=True)

    def get(self, run_id: str) -> dict[str, Any]:
        if run_id not in self.runs:
            raise KeyError(f"Unknown run: {run_id}")
        return self.runs[run_id]

    def delete(self, run_id: str) -> bool:
        return self.runs.pop(run_id, None) is not None
