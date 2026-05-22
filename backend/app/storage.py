from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def runtime_dir() -> Path:
    root = os.environ.get("MLSTUDIO_HOME")
    path = Path(root) if root else Path.cwd() / ".mlstudio_runtime"
    path.mkdir(parents=True, exist_ok=True)
    for child in ("datasets", "models", "exports", "runs", "architectures"):
        (path / child).mkdir(exist_ok=True)
    return path


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, default=str), encoding="utf-8")


def ensure_project(project_path: Path, name: str = "ML Lab Studio Project") -> dict[str, Any]:
    project_path.mkdir(parents=True, exist_ok=True)
    for child in ("datasets", "notebooks", "models", "exports", "runs", "architectures"):
        (project_path / child).mkdir(exist_ok=True)
    meta_dir = project_path / ".mlstudio"
    meta_dir.mkdir(exist_ok=True)
    meta_file = meta_dir / "project.json"
    if meta_file.exists():
        return read_json(meta_file, {})
    metadata = {
        "name": name,
        "created_at": utc_now(),
        "updated_at": utc_now(),
        "version": "0.1.0",
        "settings": {
            "trusted_local_code": True,
            "default_backend_url": "http://127.0.0.1:8765",
        },
    }
    write_json(meta_file, metadata)
    return metadata
