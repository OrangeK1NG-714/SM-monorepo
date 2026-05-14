#!/usr/bin/env python3
"""Run trained recommender model against provided candidate rows."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd


def main() -> None:
    if len(sys.argv) > 1:
        payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    else:
        payload = json.loads(sys.stdin.read())

    model_path = Path(payload.get("model_path", "artifacts/recommender_model.joblib"))
    metrics_path = Path(payload.get("metrics_path", "artifacts/metrics.json"))
    rows = payload.get("rows", [])

    if not model_path.exists():
        raise FileNotFoundError(f"model not found: {model_path}")
    if not metrics_path.exists():
        raise FileNotFoundError(f"metrics not found: {metrics_path}")
    if not rows:
        print(json.dumps({"items": []}, ensure_ascii=False))
        return

    model = joblib.load(model_path)
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    feature_columns = metrics.get("feature_columns", [])

    df = pd.DataFrame(rows)
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0.0

    probs = model.predict_proba(df[feature_columns])[:, 1]
    df["match_score"] = probs
    df = df.sort_values("match_score", ascending=False)

    items = []
    for row in df.to_dict(orient="records"):
        items.append({
            "mentor": row.get("mentor") or row.get("teacher_id") or row.get("teacherId"),
            "teacher_id": row.get("teacher_id") or row.get("teacherId"),
            "match_score": round(float(row["match_score"]), 6),
            "raw": row,
        })

    print(json.dumps({"items": items, "feature_columns": feature_columns}, ensure_ascii=False))


if __name__ == "__main__":
    main()
