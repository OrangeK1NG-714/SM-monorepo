#!/usr/bin/env python3
"""Quick evaluator for latest training outputs."""

from __future__ import annotations

import json
from pathlib import Path


def level(value: float, good: float, warn: float) -> str:
    if value >= good:
        return "good"
    if value >= warn:
        return "ok"
    return "weak"


def main() -> None:
    metrics_path = Path("artifacts/metrics.json")
    if not metrics_path.exists():
        raise FileNotFoundError("metrics.json not found. Run training first.")

    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))

    auc = float(metrics.get("auc", 0.0))
    precision = float(metrics.get("precision", 0.0))
    recall = float(metrics.get("recall", 0.0))
    top3 = metrics.get("top3_hit_rate")
    group_count = int(metrics.get("topk_group_count", 0))

    print("=== Latest Model Evaluation ===")
    print(f"AUC: {auc:.4f} ({level(auc, 0.85, 0.75)})")
    print(f"Precision: {precision:.4f} ({level(precision, 0.35, 0.2)})")
    print(f"Recall: {recall:.4f} ({level(recall, 0.7, 0.5)})")
    print(f"Top3 Hit Rate: {top3}")
    print(f"TopK Group Count: {group_count}")

    if group_count < 20:
        print("[WARN] topk_group_count is small; Top1/Top3 may be optimistic.")

    print("Feature columns:", ", ".join(metrics.get("feature_columns", [])))


if __name__ == "__main__":
    main()
