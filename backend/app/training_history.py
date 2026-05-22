from __future__ import annotations

from typing import Any


def normalize_history(history: list[dict[str, Any]]) -> dict[str, list[Any]]:
    keys = sorted({key for row in history for key in row})
    return {key: [row.get(key) for row in history] for key in keys}
