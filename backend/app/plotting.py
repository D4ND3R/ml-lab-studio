from __future__ import annotations

import json
from typing import Any

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from .datasets import DatasetManager
from .sessions import SessionManager


def figure_response(fig: go.Figure, warning: str | None = None) -> dict[str, Any]:
    payload = {"type": "plotly", "figure": json.loads(fig.to_json())}
    if warning:
        payload["warning"] = warning
    return payload


def create_plot(dataset_manager: DatasetManager, payload: dict[str, Any]) -> dict[str, Any]:
    df = dataset_manager.get(payload["dataset_id"])
    sample_size = int(payload.get("sample_size", 500))
    if len(df) > sample_size:
        df = df.sample(sample_size, random_state=42)
    plot_type = payload.get("plot_type", "scatter")
    x = payload.get("x")
    y = payload.get("y")
    z = payload.get("z")
    color = payload.get("color")
    size = payload.get("size")

    if plot_type == "scatter":
        fig = px.scatter(df, x=x, y=y, color=color, size=size)
    elif plot_type == "line":
        fig = px.line(df, x=x, y=y, color=color)
    elif plot_type == "bar":
        fig = px.bar(df, x=x, y=y, color=color)
    elif plot_type == "histogram":
        fig = px.histogram(df, x=x, color=color)
    elif plot_type == "box":
        fig = px.box(df, x=x, y=y, color=color)
    elif plot_type in {"heatmap", "correlation"}:
        numeric = df.select_dtypes(include="number")
        fig = px.imshow(numeric.corr(numeric_only=True), text_auto=True, color_continuous_scale="RdBu_r")
    elif plot_type == "scatter3d":
        fig = px.scatter_3d(df, x=x, y=y, z=z, color=color, size=size)
    elif plot_type == "surface":
        pivot = df.pivot_table(index=y, columns=x, values=z, aggfunc="mean")
        fig = go.Figure(data=[go.Surface(z=pivot.values, x=pivot.columns, y=pivot.index)])
    else:
        raise ValueError(f"Unsupported plot type: {plot_type}")
    fig.update_layout(template="plotly_dark", margin=dict(l=16, r=16, t=32, b=16))
    return figure_response(fig)


def decision_boundary(
    dataset_manager: DatasetManager,
    session_manager: SessionManager,
    payload: dict[str, Any],
) -> dict[str, Any]:
    df = dataset_manager.get(payload["dataset_id"]).dropna()
    session = session_manager.get(payload["session_id"])
    model = session.namespace.get(payload["model_name"])
    if model is None:
        raise KeyError(f"Model variable {payload['model_name']} was not found in the notebook session.")

    x_feature = payload["x_feature"]
    y_feature = payload["y_feature"]
    target_column = payload["target_column"]
    grid_size = int(payload.get("grid_size", 120))

    x_values = pd.to_numeric(df[x_feature], errors="coerce")
    y_values = pd.to_numeric(df[y_feature], errors="coerce")
    valid = x_values.notna() & y_values.notna()
    df = df.loc[valid].copy()
    x_values = x_values.loc[valid]
    y_values = y_values.loc[valid]

    x_min, x_max = x_values.min(), x_values.max()
    y_min, y_max = y_values.min(), y_values.max()
    x_pad = (x_max - x_min) * 0.12 or 1
    y_pad = (y_max - y_min) * 0.12 or 1
    xx, yy = np.meshgrid(
        np.linspace(x_min - x_pad, x_max + x_pad, grid_size),
        np.linspace(y_min - y_pad, y_max + y_pad, grid_size),
    )

    feature_names = list(getattr(model, "feature_names_in_", []))
    warning = None
    if not feature_names:
        n_features = int(getattr(model, "n_features_in_", 2))
        if n_features == 2:
            feature_names = [x_feature, y_feature]
        else:
            numeric_columns = [c for c in df.select_dtypes(include="number").columns if c != target_column]
            feature_names = numeric_columns[:n_features]
            warning = "Decision boundary is approximate because model feature names were not available."

    grid = pd.DataFrame(index=range(xx.size))
    for feature in feature_names:
        if feature == x_feature:
            grid[feature] = xx.ravel()
        elif feature == y_feature:
            grid[feature] = yy.ravel()
        elif feature in df.columns and pd.api.types.is_numeric_dtype(df[feature]):
            grid[feature] = df[feature].median()
            warning = warning or "Decision boundary is approximate because extra numeric features are fixed at their median."
        elif feature in df.columns:
            grid[feature] = df[feature].mode(dropna=True).iloc[0]
            warning = warning or "Decision boundary is approximate because extra categorical features are fixed at their mode."
        else:
            grid[feature] = 0
            warning = warning or "Decision boundary is approximate because missing model features were filled with 0."

    try:
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(grid)
            z = proba[:, 1] if proba.ndim == 2 and proba.shape[1] > 1 else proba.ravel()
        else:
            z = model.predict(grid)
    except Exception:
        z = model.predict(grid.to_numpy())

    z_grid = np.asarray(z).reshape(xx.shape)
    fig = go.Figure()
    fig.add_trace(
        go.Contour(
            x=xx[0],
            y=yy[:, 0],
            z=z_grid,
            colorscale="Viridis",
            opacity=0.62,
            contours=dict(showlines=False),
            name="boundary",
            showscale=True,
        )
    )
    fig.add_trace(
        go.Scatter(
            x=x_values,
            y=y_values,
            mode="markers",
            marker=dict(color=pd.factorize(df[target_column])[0], colorscale="Turbo", line=dict(color="#111827", width=1)),
            text=df[target_column].astype(str),
            name="samples",
        )
    )
    fig.update_layout(
        template="plotly_dark",
        xaxis_title=x_feature,
        yaxis_title=y_feature,
        margin=dict(l=16, r=16, t=32, b=16),
    )
    return figure_response(fig, warning=warning)
