from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib

from .storage import new_id, runtime_dir, utc_now


class ModelRegistry:
    def __init__(self) -> None:
        self.models: dict[str, dict[str, Any]] = {}

    def list(self) -> list[dict[str, Any]]:
        return list(self.models.values())

    def save(self, session_namespace: dict[str, Any], model_name: str, path: str | None, metadata: dict[str, Any]) -> dict[str, Any]:
        if model_name not in session_namespace:
            raise KeyError(f"Model variable {model_name} not found.")
        model = session_namespace[model_name]
        model_id = new_id("model")
        target_path = Path(path) if path else runtime_dir() / "models" / f"{model_id}.joblib"
        target_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            joblib.dump(model, target_path)
            fmt = "joblib"
        except Exception:
            import torch

            torch.save(model.state_dict(), target_path.with_suffix(".pt"))
            target_path = target_path.with_suffix(".pt")
            fmt = "pt"
        card = {
            "id": model_id,
            "name": model_name,
            "path": str(target_path),
            "format": fmt,
            "created_date": utc_now(),
            "framework": metadata.get("framework", "sklearn" if fmt == "joblib" else "PyTorch"),
            "algorithm": metadata.get("algorithm", type(model).__name__),
            "dataset": metadata.get("dataset"),
            "target_column": metadata.get("target_column"),
            "features": metadata.get("features", []),
            "metrics": metadata.get("metrics", {}),
            "notes": metadata.get("notes", ""),
            "device_used": metadata.get("device_used", "CPU"),
        }
        self.models[model_id] = card
        return card

    def load(self, session_namespace: dict[str, Any], path: str, variable_name: str) -> dict[str, Any]:
        model = joblib.load(path)
        session_namespace[variable_name] = model
        return {"variable_name": variable_name, "type": type(model).__name__}

    def delete(self, model_id: str) -> bool:
        return self.models.pop(model_id, None) is not None
