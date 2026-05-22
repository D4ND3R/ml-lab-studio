from __future__ import annotations

from typing import Any

from .deep_learning import inspect_weights
from .sessions import SessionManager


def weights_for_model(session_manager: SessionManager, session_id: str, model_name: str) -> dict[str, Any]:
    model = session_manager.get(session_id).namespace.get(model_name)
    if model is None:
        raise KeyError(f"Model variable {model_name} was not found.")
    return {"model_name": model_name, "weights": inspect_weights(model)}


def activation_placeholder() -> dict[str, Any]:
    return {
        "status": "placeholder",
        "message": "Activation capture is scaffolded for the MVP. Add forward hooks for selected PyTorch layers next.",
    }
