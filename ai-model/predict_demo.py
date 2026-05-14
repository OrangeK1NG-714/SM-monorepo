#!/usr/bin/env python3
"""Quick prediction demo for the trained recommendation model."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd


def load_feature_columns() -> list[str]:
    metrics_path = Path("artifacts/metrics.json")
    if not metrics_path.exists():
        return [
            "direction_match",
            "teacher_capacity_ratio",
            "teacher_popularity",
            "history_accept_rate",
            "gpa_level",
            "portfolio_score",
            "student_priority",
            "same_track",
        ]
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    return metrics.get("feature_columns", [])


def main() -> None:
    model_path = Path("artifacts/recommender_model.joblib")
    if not model_path.exists():
        raise FileNotFoundError("Model not found. Please run train_recommender.py first.")

    model = joblib.load(model_path)
    feature_columns = load_feature_columns()

    # Example: one student + three mentors
    rows = [
        {
            "mentor": "A",
            "direction_match": 0.92,
            "teacher_capacity_ratio": 0.35,
            "teacher_popularity": 0.55,
            "history_accept_rate": 0.71,
            "gpa_level": 0.84,
            "portfolio_score": 0.80,
            "student_priority": 1,
            "same_track": 1,
            "teacher_ai_score": 0.80,
            "teacher_design_score": 0.60,
            "teacher_engineering_score": 0.55,
            "teacher_profile_richness": 0.88,
        },
        {
            "mentor": "B",
            "direction_match": 0.67,
            "teacher_capacity_ratio": 0.20,
            "teacher_popularity": 0.25,
            "history_accept_rate": 0.88,
            "gpa_level": 0.84,
            "portfolio_score": 0.80,
            "student_priority": 2,
            "same_track": 0,
            "teacher_ai_score": 0.45,
            "teacher_design_score": 0.86,
            "teacher_engineering_score": 0.38,
            "teacher_profile_richness": 0.72,
        },
        {
            "mentor": "C",
            "direction_match": 0.50,
            "teacher_capacity_ratio": 0.78,
            "teacher_popularity": 0.90,
            "history_accept_rate": 0.26,
            "gpa_level": 0.84,
            "portfolio_score": 0.80,
            "student_priority": 3,
            "same_track": 0,
            "teacher_ai_score": 0.30,
            "teacher_design_score": 0.50,
            "teacher_engineering_score": 0.40,
            "teacher_profile_richness": 0.66,
        },
    ]

    df = pd.DataFrame(rows)
    missing_cols = [c for c in feature_columns if c not in df.columns]
    for c in missing_cols:
        df[c] = 0.0

    probs = model.predict_proba(df[feature_columns])[:, 1]
    df["match_score"] = probs

    df = df.sort_values("match_score", ascending=False)
    print(df[["mentor", "match_score"]].to_string(index=False))


if __name__ == "__main__":
    main()
