from __future__ import annotations

import io
import sqlite3
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from .storage import new_id


IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tif", ".tiff"}


def clean_json(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, int, bool)):
        return value
    if isinstance(value, float):
        return None if not np.isfinite(value) else value
    if isinstance(value, np.generic):
        return clean_json(value.item())
    if isinstance(value, dict):
        return {str(k): clean_json(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [clean_json(v) for v in value]
    if pd.isna(value):
        return None
    return str(value)


def semantic_type(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if series.astype(str).str.lower().str.match(r".*\.(png|jpg|jpeg|gif|bmp|webp|tif|tiff)$").any():
        return "image"
    unique_ratio = series.nunique(dropna=True) / max(len(series), 1)
    if unique_ratio < 0.2:
        return "categorical"
    return "text"


def describe_dataframe(dataset_id: str, name: str, fmt: str, df: pd.DataFrame, sample_size: int = 500) -> dict[str, Any]:
    sample = df.head(sample_size).replace({np.nan: None})
    schema = []
    for column in df.columns:
        series = df[column]
        schema.append(
            {
                "name": str(column),
                "dtype": str(series.dtype),
                "semantic_type": semantic_type(series),
                "missing": int(series.isna().sum()),
                "unique": int(series.nunique(dropna=True)),
            }
        )

    numeric = df.select_dtypes(include="number")
    stats = clean_json(numeric.describe().transpose().reset_index().rename(columns={"index": "column"}).to_dict("records"))
    correlations = []
    if len(numeric.columns) > 1:
        corr = numeric.corr(numeric_only=True).replace({np.nan: None})
        correlations = clean_json(
            [
                {"x": str(x), "y": str(y), "value": corr.loc[x, y]}
                for x in corr.columns
                for y in corr.index
            ]
        )

    missing = [
        {
            "column": str(column),
            "missing": int(df[column].isna().sum()),
            "percent": round(float(df[column].isna().mean() * 100), 2),
        }
        for column in df.columns
    ]

    class_distribution: dict[str, Any] = {}
    for column in df.columns:
        if semantic_type(df[column]) == "categorical":
            class_distribution[str(column)] = clean_json(df[column].value_counts(dropna=False).head(50).to_dict())

    return {
        "id": dataset_id,
        "name": name,
        "format": fmt,
        "rows": int(len(df)),
        "columns": [str(c) for c in df.columns],
        "preview": clean_json(sample.to_dict(orient="records")),
        "schema": schema,
        "stats": stats,
        "missing": missing,
        "duplicate_rows": int(df.duplicated().sum()),
        "correlations": correlations,
        "class_distribution": class_distribution,
    }


class DatasetManager:
    def __init__(self) -> None:
        self.datasets: dict[str, pd.DataFrame] = {}
        self.metadata: dict[str, dict[str, Any]] = {}

    def import_bytes(self, filename: str, data: bytes) -> dict[str, Any]:
        suffix = Path(filename).suffix.lower()
        buffer = io.BytesIO(data)
        if suffix == ".csv":
            df = pd.read_csv(buffer)
            fmt = "csv"
        elif suffix == ".tsv":
            df = pd.read_csv(buffer, sep="\t")
            fmt = "tsv"
        elif suffix == ".json":
            df = pd.read_json(buffer)
            fmt = "json"
        elif suffix == ".jsonl":
            df = pd.read_json(buffer, lines=True)
            fmt = "jsonl"
        elif suffix in {".xlsx", ".xls"}:
            df = pd.read_excel(buffer)
            fmt = "excel"
        elif suffix == ".parquet":
            df = pd.read_parquet(buffer)
            fmt = "parquet"
        elif suffix in {".feather", ".ft"}:
            df = pd.read_feather(buffer)
            fmt = "feather"
        elif suffix in {".sqlite", ".db"}:
            temp = io.BytesIO(data)
            raise ValueError("SQLite import from upload is not supported in the MVP. Use CSV export or a local path import.")
        else:
            try:
                df = pd.read_csv(buffer)
                fmt = "generic-csv"
            except Exception as exc:  # noqa: BLE001
                raise ValueError(f"Unsupported dataset format for {filename}") from exc
        return self.add_dataframe(filename, fmt, df)

    def import_sqlite_table(self, path: str, table: str) -> dict[str, Any]:
        with sqlite3.connect(path) as conn:
            df = pd.read_sql_query(f"SELECT * FROM {table}", conn)
        return self.add_dataframe(f"{Path(path).name}:{table}", "sqlite", df)

    def import_image_folder(self, folder: str) -> dict[str, Any]:
        root = Path(folder)
        rows = []
        for path in root.rglob("*"):
            if path.suffix.lower() in IMAGE_SUFFIXES:
                rows.append({"path": str(path), "label": path.parent.name})
        return self.add_dataframe(root.name, "image-folder", pd.DataFrame(rows))

    def add_dataframe(self, name: str, fmt: str, df: pd.DataFrame) -> dict[str, Any]:
        dataset_id = new_id("ds")
        self.datasets[dataset_id] = df.copy()
        self.metadata[dataset_id] = {"name": name, "format": fmt}
        return describe_dataframe(dataset_id, name, fmt, df)

    def get(self, dataset_id: str) -> pd.DataFrame:
        if dataset_id not in self.datasets:
            raise KeyError(f"Unknown dataset: {dataset_id}")
        return self.datasets[dataset_id]

    def describe(self, dataset_id: str) -> dict[str, Any]:
        df = self.get(dataset_id)
        meta = self.metadata[dataset_id]
        return describe_dataframe(dataset_id, meta["name"], meta["format"], df)

    def save(self, dataset_id: str, rows: list[dict[str, Any]], name: str | None = None) -> dict[str, Any]:
        df = pd.DataFrame(rows)
        self.datasets[dataset_id] = df
        if name:
            self.metadata[dataset_id]["name"] = name
        meta = self.metadata[dataset_id]
        return describe_dataframe(dataset_id, meta["name"], meta["format"], df)

    def export(self, dataset_id: str, fmt: str) -> dict[str, Any]:
        df = self.get(dataset_id)
        if fmt == "csv":
            content = df.to_csv(index=False)
            mime = "text/csv"
        elif fmt == "json":
            content = df.to_json(orient="records", indent=2)
            mime = "application/json"
        elif fmt == "jsonl":
            content = df.to_json(orient="records", lines=True)
            mime = "application/jsonl"
        elif fmt == "parquet":
            buffer = io.BytesIO()
            df.to_parquet(buffer, index=False)
            content = buffer.getvalue().hex()
            mime = "application/octet-stream"
        else:
            raise ValueError(f"Unsupported export format: {fmt}")
        return {"format": fmt, "mime": mime, "content": content}
