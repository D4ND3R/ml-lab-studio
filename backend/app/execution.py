from __future__ import annotations

import ast
import base64
import io
import json
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from contextlib import redirect_stderr, redirect_stdout
from dataclasses import dataclass, field
from typing import Any


def _json_clean(value: Any) -> Any:
    try:
        import numpy as np
        import pandas as pd
    except Exception:  # pragma: no cover - optional import fallback
        np = None
        pd = None

    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if np is not None and isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {str(k): _json_clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_clean(v) for v in value]
    if pd is not None and pd.isna(value):
        return None
    return str(value)


def serialize_value(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None

    try:
        import pandas as pd
    except Exception:  # pragma: no cover
        pd = None

    if pd is not None and isinstance(value, pd.DataFrame):
        preview = value.head(200).replace({float("nan"): None})
        return {
            "type": "dataframe",
            "shape": list(value.shape),
            "columns": [str(c) for c in value.columns],
            "rows": _json_clean(preview.to_dict(orient="records")),
        }
    if pd is not None and isinstance(value, pd.Series):
        return serialize_value(value.to_frame())

    try:
        import plotly.graph_objects as go

        if isinstance(value, go.Figure):
            return {"type": "plotly", "figure": json.loads(value.to_json())}
    except Exception:
        pass

    try:
        json.dumps(value)
        return {"type": "value", "value": _json_clean(value), "repr": repr(value)}
    except TypeError:
        return {"type": "text", "text": repr(value)}


def capture_matplotlib_figures() -> list[dict[str, Any]]:
    outputs: list[dict[str, Any]] = []
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception:
        return outputs

    for number in plt.get_fignums():
        fig = plt.figure(number)
        buffer = io.BytesIO()
        fig.savefig(buffer, format="png", bbox_inches="tight", dpi=140)
        data = base64.b64encode(buffer.getvalue()).decode("ascii")
        outputs.append({"type": "image", "mime": "image/png", "data": f"data:image/png;base64,{data}"})
    plt.close("all")
    return outputs


def _exec_with_last_expr(code: str, namespace: dict[str, Any]) -> Any:
    tree = ast.parse(code, mode="exec")
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        expr = ast.Expression(tree.body.pop().value)
        ast.fix_missing_locations(tree)
        ast.fix_missing_locations(expr)
        if tree.body:
            exec(compile(tree, "<ml-lab-cell>", "exec"), namespace, namespace)
        return eval(compile(expr, "<ml-lab-cell>", "eval"), namespace, namespace)
    exec(compile(tree, "<ml-lab-cell>", "exec"), namespace, namespace)
    return None


def run_python(code: str, namespace: dict[str, Any]) -> dict[str, Any]:
    stdout = io.StringIO()
    stderr = io.StringIO()
    outputs: list[dict[str, Any]] = []
    error: dict[str, Any] | None = None
    start = time.perf_counter()

    try:
        with redirect_stdout(stdout), redirect_stderr(stderr):
            result = _exec_with_last_expr(code, namespace)
        serialized = serialize_value(result)
        if serialized:
            outputs.append(serialized)
        outputs.extend(capture_matplotlib_figures())
    except Exception as exc:  # noqa: BLE001 - notebook cells should surface any Python error
        error = {
            "ename": exc.__class__.__name__,
            "evalue": str(exc),
            "traceback": traceback.format_exc(),
        }

    return {
        "stdout": stdout.getvalue(),
        "stderr": stderr.getvalue(),
        "duration_ms": round((time.perf_counter() - start) * 1000, 2),
        "outputs": outputs,
        "error": error,
    }


@dataclass
class NotebookSession:
    id: str
    name: str
    namespace: dict[str, Any] = field(default_factory=dict)
    execution_count: int = 0

    def __post_init__(self) -> None:
        self.namespace.setdefault("__name__", "__ml_lab_notebook__")


class SessionManager:
    def __init__(self) -> None:
        self.sessions: dict[str, NotebookSession] = {}
        self.executor = ThreadPoolExecutor(max_workers=4)

    def create(self, session_id: str, name: str) -> NotebookSession:
        session = NotebookSession(id=session_id, name=name)
        self.sessions[session_id] = session
        return session

    def delete(self, session_id: str) -> bool:
        return self.sessions.pop(session_id, None) is not None

    def get(self, session_id: str) -> NotebookSession:
        if session_id not in self.sessions:
            raise KeyError(f"Unknown session: {session_id}")
        return self.sessions[session_id]

    def execute(self, session_id: str, code: str, timeout: int) -> dict[str, Any]:
        session = self.get(session_id)
        future = self.executor.submit(run_python, code, session.namespace)
        try:
            result = future.result(timeout=timeout)
        except FutureTimeout:
            return {
                "execution_count": session.execution_count,
                "stdout": "",
                "stderr": "",
                "duration_ms": timeout * 1000,
                "outputs": [],
                "error": {
                    "ename": "TimeoutError",
                    "evalue": f"Execution exceeded {timeout} seconds.",
                    "traceback": "",
                },
            }
        session.execution_count += 1
        result["execution_count"] = session.execution_count
        return result

    def interrupt(self, session_id: str) -> dict[str, Any]:
        self.get(session_id)
        return {
            "status": "requested",
            "message": "The MVP executor uses trusted local exec. Long-running threads time out but cannot always be killed immediately.",
        }

    def variables(self, session_id: str) -> list[dict[str, Any]]:
        session = self.get(session_id)
        variables = []
        for name, value in sorted(session.namespace.items()):
            if name.startswith("__"):
                continue
            variables.append(describe_variable(name, value))
        return variables


def describe_variable(name: str, value: Any) -> dict[str, Any]:
    info: dict[str, Any] = {
        "name": name,
        "type": type(value).__name__,
        "repr": repr(value)[:500],
        "capabilities": [],
    }
    if hasattr(value, "shape"):
        try:
            info["shape"] = list(value.shape)
        except Exception:
            pass
    if hasattr(value, "columns"):
        try:
            info["columns"] = [str(c) for c in value.columns]
        except Exception:
            pass
    if hasattr(value, "predict"):
        info["capabilities"].append("predict")
    if hasattr(value, "predict_proba"):
        info["capabilities"].append("predict_proba")
    if hasattr(value, "feature_importances_") or hasattr(value, "coef_"):
        info["capabilities"].append("feature_importance")
    try:
        import torch

        if isinstance(value, torch.nn.Module):
            info["framework"] = "PyTorch"
            info["capabilities"].extend(["torch_module", "weights", "summary"])
    except Exception:
        pass
    return info
