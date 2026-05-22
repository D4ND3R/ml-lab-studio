from __future__ import annotations

import importlib.util
from typing import Any

import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

from .datasets import DatasetManager
from .nn_architecture import generate_pytorch_code, validate_architecture
from .sessions import SessionManager


def torch_status() -> dict[str, Any]:
    if importlib.util.find_spec("torch") is None:
        return {
            "torch_available": False,
            "devices": ["CPU"],
            "active": "CPU",
            "install_command": "pip install torch torchvision torchaudio",
            "warning": "PyTorch is optional and is not installed. Classical ML features still work.",
        }
    import torch

    devices = ["CPU"]
    if torch.cuda.is_available():
        devices.append("CUDA")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        devices.append("MPS")
    active = "CUDA" if "CUDA" in devices else "MPS" if "MPS" in devices else "CPU"
    return {"torch_available": True, "devices": devices, "active": active, "install_command": "pip install torch torchvision torchaudio"}


def _build_torch_model(architecture: dict[str, Any], input_size: int, output_size: int):
    import torch
    from torch import nn

    modules = []
    previous = input_size
    for layer in architecture.get("layers", []):
        layer_type = str(layer.get("type", "")).lower()
        if layer_type == "linear":
            units = int(layer.get("units", output_size))
            modules.append(nn.Linear(previous, units))
            previous = units
        elif layer_type == "relu":
            modules.append(nn.ReLU())
        elif layer_type == "sigmoid":
            modules.append(nn.Sigmoid())
        elif layer_type == "tanh":
            modules.append(nn.Tanh())
        elif layer_type == "dropout":
            modules.append(nn.Dropout(p=float(layer.get("rate", 0.2))))
        elif layer_type == "batchnorm1d":
            modules.append(nn.BatchNorm1d(previous))
        elif layer_type == "flatten":
            modules.append(nn.Flatten())
    if not modules or not isinstance(modules[-1], nn.Linear) or modules[-1].out_features != output_size:
        modules.append(nn.Linear(previous, output_size))
    return nn.Sequential(*modules)


def train_mlp(
    dataset_manager: DatasetManager,
    session_manager: SessionManager,
    payload: dict[str, Any],
) -> dict[str, Any]:
    status = torch_status()
    if not status["torch_available"]:
        return {"ok": False, "error": status["warning"], "devices": status}

    import torch
    from torch import nn
    from torch.utils.data import DataLoader, TensorDataset

    df = dataset_manager.get(payload["dataset_id"]).dropna(subset=payload["feature_columns"] + [payload["target_column"]])
    X = df[payload["feature_columns"]].astype(float).to_numpy()
    labels = LabelEncoder().fit_transform(df[payload["target_column"]].astype(str))
    scaler = StandardScaler()
    X = scaler.fit_transform(X).astype("float32")
    y = labels.astype("int64")

    X_train, X_val, y_train, y_val = train_test_split(
        X,
        y,
        test_size=float(payload.get("validation_split", 0.2)),
        random_state=int(payload.get("random_seed", 42)),
        stratify=y if len(set(y)) > 1 else None,
    )

    device_name = status["active"].lower()
    device = torch.device("cuda" if device_name == "cuda" else "mps" if device_name == "mps" else "cpu")
    torch.manual_seed(int(payload.get("random_seed", 42)))
    model = _build_torch_model(payload["architecture"], X.shape[1], int(np.max(y)) + 1).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=float(payload.get("learning_rate", 0.01)))
    loss_fn = nn.CrossEntropyLoss()

    train_loader = DataLoader(
        TensorDataset(torch.tensor(X_train), torch.tensor(y_train)),
        batch_size=int(payload.get("batch_size", 16)),
        shuffle=True,
    )
    val_x = torch.tensor(X_val).to(device)
    val_y = torch.tensor(y_val).to(device)
    history = []

    for epoch in range(1, int(payload.get("epochs", 25)) + 1):
        model.train()
        losses = []
        for xb, yb in train_loader:
            xb = xb.to(device)
            yb = yb.to(device)
            optimizer.zero_grad()
            logits = model(xb)
            loss = loss_fn(logits, yb)
            loss.backward()
            optimizer.step()
            losses.append(float(loss.detach().cpu()))
        model.eval()
        with torch.no_grad():
            val_logits = model(val_x)
            val_loss = float(loss_fn(val_logits, val_y).detach().cpu())
            predictions = val_logits.argmax(dim=1).cpu().numpy()
        history.append(
            {
                "epoch": epoch,
                "train_loss": round(float(np.mean(losses)), 5),
                "val_loss": round(val_loss, 5),
                "accuracy": round(float(accuracy_score(y_val, predictions)), 5),
                "f1": round(float(f1_score(y_val, predictions, average="weighted")), 5),
                "learning_rate": optimizer.param_groups[0]["lr"],
            }
        )

    model_name = payload.get("model_name", "torch_model")
    if payload.get("session_id"):
        session = session_manager.get(payload["session_id"])
        session.namespace[model_name] = model
        session.namespace[f"{model_name}_history"] = history
        session.namespace[f"{model_name}_scaler"] = scaler

    metrics = history[-1] if history else {}
    cm = confusion_matrix(y_val, predictions).tolist()
    return {
        "ok": True,
        "model_name": model_name,
        "history": history,
        "metrics": metrics,
        "confusion_matrix": cm,
        "device": status["active"],
        "class_names": [str(c) for c in sorted(df[payload["target_column"]].astype(str).unique())],
        "weights": inspect_weights(model),
    }


def inspect_weights(model: Any) -> list[dict[str, Any]]:
    weights = []
    try:
        for name, parameter in model.named_parameters():
            data = parameter.detach().cpu().numpy()
            weights.append(
                {
                    "name": name,
                    "shape": list(data.shape),
                    "mean": float(data.mean()),
                    "std": float(data.std()),
                    "min": float(data.min()),
                    "max": float(data.max()),
                    "sample": data.flatten()[:100].round(5).tolist(),
                }
            )
    except Exception:
        return []
    return weights


def model_summary_from_session(session_manager: SessionManager, session_id: str, model_name: str) -> dict[str, Any]:
    model = session_manager.get(session_id).namespace.get(model_name)
    if model is None:
        raise KeyError(f"Model variable {model_name} was not found.")
    parameter_count = 0
    layers = []
    try:
        for name, module in model.named_modules():
            if not name:
                continue
            params = sum(p.numel() for p in module.parameters(recurse=False))
            parameter_count += params
            layers.append({"name": name, "type": module.__class__.__name__, "parameters": params})
    except Exception:
        return {"name": model_name, "repr": repr(model), "layers": [], "parameters": 0}
    return {"name": model_name, "repr": repr(model), "layers": layers, "parameters": parameter_count}


def validate(payload: dict[str, Any]) -> dict[str, Any]:
    return validate_architecture(payload["architecture"])


def generate_code(payload: dict[str, Any]) -> dict[str, Any]:
    return {"code": generate_pytorch_code(payload["architecture"])}
