#!/usr/bin/env python3
"""
Train a lightweight mentor-student matching model for SM-DA project.

Usage:
  python train_recommender.py
  python train_recommender.py --from-mongo --mongo-uri mongodb://127.0.0.1/ms-da-projects
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

BASE_FEATURE_COLUMNS = [
    "direction_match",
    "teacher_capacity_ratio",
    "teacher_popularity",
    "history_accept_rate",
    "gpa_level",
    "portfolio_score",
    "student_priority",
    "same_track",
]
OPTIONAL_FEATURE_COLUMNS = [
    "teacher_ai_score",
    "teacher_design_score",
    "teacher_engineering_score",
    "teacher_profile_richness",
    "competition_index",
    "cold_teacher_flag",
    "acceptance_safety",
]
TARGET_COLUMN = "label"
GROUP_COLUMN = "student_id"


def get_feature_columns(df: pd.DataFrame) -> list[str]:
    cols = [c for c in BASE_FEATURE_COLUMNS if c in df.columns]
    cols.extend([c for c in OPTIONAL_FEATURE_COLUMNS if c in df.columns])
    return cols


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train recommendation model")
    parser.add_argument("--from-mongo", action="store_true", help="Build dataset from MongoDB first")
    parser.add_argument("--mongo-uri", default="mongodb://127.0.0.1/ms-da-projects", help="Mongo connection uri")
    parser.add_argument("--data-path", default="data/training_pairs.csv", help="Training CSV path")
    parser.add_argument("--artifact-dir", default="artifacts", help="Model output directory")
    parser.add_argument("--seed-size", type=int, default=2000, help="Synthetic samples when no data available")
    return parser.parse_args()


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def generate_seed_data(size: int) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    rows = []
    teacher_pool = [f"T{i:03d}" for i in range(1, 31)]
    activity_id = "seed-activity-1"

    for i in range(size):
        direction_match = rng.uniform(0, 1)
        teacher_capacity_ratio = rng.uniform(0, 1)
        teacher_popularity = rng.uniform(0, 1)
        history_accept_rate = rng.uniform(0, 1)
        gpa_level = rng.uniform(0, 1)
        portfolio_score = rng.uniform(0, 1)
        student_priority = int(rng.integers(1, 4))
        same_track = int(direction_match > 0.7)

        priority_bonus = {1: 0.16, 2: 0.08, 3: 0.02}[student_priority]
        base_score = (
            0.33 * direction_match
            + 0.22 * (1 - teacher_capacity_ratio)
            + 0.16 * history_accept_rate
            + 0.12 * gpa_level
            + 0.10 * portfolio_score
            + 0.07 * (1 - teacher_popularity)
            + priority_bonus
            + 0.04 * same_track
        )
        noisy_score = clamp(base_score + rng.normal(0, 0.05))
        label = int(noisy_score >= 0.58)

        rows.append(
            {
                "student_id": f"S{i // 10:04d}",
                "teacher_id": teacher_pool[i % len(teacher_pool)],
                "activity_id": activity_id,
                "direction_match": round(direction_match, 4),
                "teacher_capacity_ratio": round(teacher_capacity_ratio, 4),
                "teacher_popularity": round(teacher_popularity, 4),
                "history_accept_rate": round(history_accept_rate, 4),
                "gpa_level": round(gpa_level, 4),
                "portfolio_score": round(portfolio_score, 4),
                "student_priority": student_priority,
                "same_track": int(same_track),
                "label": label,
            }
        )

    return pd.DataFrame(rows)


def load_from_mongo(uri: str) -> pd.DataFrame:
    try:
        from pymongo import MongoClient
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("Please install pymongo first") from exc

    client = MongoClient(uri)
    db = client.get_default_database()

    students = list(db.Student.find({}))
    teachers = list(db.Teacher.find({}))
    finals = list(db.Final.find({}))
    user_in_activity = list(db.UserInActivity.find({}))

    if not students or not teachers:
        return pd.DataFrame()

    teacher_cap = {}
    for row in user_in_activity:
        tid = row.get("teacherId")
        aid = row.get("activityId")
        if tid and aid:
            teacher_cap[(aid, tid)] = row.get("maxSelectNum") or 5

    final_counts = {}
    for row in finals:
        tid = row.get("teacherId")
        aid = row.get("activityId")
        if tid and aid:
            key = (aid, tid)
            final_counts[key] = final_counts.get(key, 0) + 1

    teacher_popularity_max = max(final_counts.values()) if final_counts else 1

    rows = []
    for s in students:
        student_id = s.get("studentId")
        student_data = s.get("data", {}) or {}
        student_direction = str(student_data.get("direction", "")).lower()
        gpa_raw = student_data.get("gpa", 0)

        try:
            gpa = float(gpa_raw)
            gpa_level = clamp(gpa / 5.0)
        except Exception:
            gpa_level = 0.6

        student_activities = [
            row.get("activityId")
            for row in user_in_activity
            if row.get("studentId") == student_id and row.get("activityId")
        ]
        if not student_activities:
            student_activities = ["unknown-activity"]

        for activity_id in student_activities:
            for t in teachers:
                teacher_id = t.get("teacherId")
                teacher_type = str(t.get("teacherType", "")).lower()
                direction_match = 1.0 if student_direction and student_direction in teacher_type else 0.35
                same_track = int(direction_match >= 0.9)

                cap = max(1, int(teacher_cap.get((activity_id, teacher_id), 5)))
                selected = final_counts.get((activity_id, teacher_id), 0)
                teacher_capacity_ratio = clamp(selected / cap)
                teacher_popularity = clamp(selected / max(1, teacher_popularity_max))
                history_accept_rate = clamp((cap - selected) / cap)
                portfolio_score = 0.7 if student_data.get("portfolio") else 0.45

                final_match = any(
                    f.get("activityId") == activity_id
                    and f.get("studentId") == student_id
                    and f.get("teacherId") == teacher_id
                    for f in finals
                )

                rows.append(
                    {
                        "student_id": student_id,
                        "teacher_id": teacher_id,
                        "activity_id": activity_id,
                        "direction_match": round(direction_match, 4),
                        "teacher_capacity_ratio": round(teacher_capacity_ratio, 4),
                        "teacher_popularity": round(teacher_popularity, 4),
                        "history_accept_rate": round(history_accept_rate, 4),
                        "gpa_level": round(gpa_level, 4),
                        "portfolio_score": round(portfolio_score, 4),
                        "student_priority": 1,
                        "same_track": same_track,
                        "label": int(final_match),
                    }
                )

    return pd.DataFrame(rows)


def load_or_prepare_data(args: argparse.Namespace) -> Tuple[pd.DataFrame, str]:
    data_path = Path(args.data_path)
    ensure_dir(data_path.parent)

    data_source = "csv"
    if args.from_mongo:
        df = load_from_mongo(args.mongo_uri)
        if not df.empty and df[TARGET_COLUMN].nunique() > 1:
            df.to_csv(data_path, index=False)
            return df, "mongo"

    if data_path.exists():
        df = pd.read_csv(data_path)
        if not df.empty and TARGET_COLUMN in df.columns and df[TARGET_COLUMN].nunique() > 1:
            return df, data_source

    df = generate_seed_data(args.seed_size)
    df.to_csv(data_path, index=False)
    return df, "synthetic"


def compute_topk_metrics(eval_df: pd.DataFrame, k: int = 3) -> dict:
    if GROUP_COLUMN not in eval_df.columns:
        return {"top1_hit_rate": None, "top3_hit_rate": None, "group_count": 0}

    groups = eval_df.groupby(GROUP_COLUMN)
    valid_groups = 0
    top1_hits = 0
    topk_hits = 0

    for _, g in groups:
        if g[TARGET_COLUMN].sum() <= 0:
            continue
        valid_groups += 1

        ranked = g.sort_values("pred_score", ascending=False)
        if ranked.head(1)[TARGET_COLUMN].max() == 1:
            top1_hits += 1
        if ranked.head(k)[TARGET_COLUMN].max() == 1:
            topk_hits += 1

    if valid_groups == 0:
        return {"top1_hit_rate": None, "top3_hit_rate": None, "group_count": 0}

    return {
        "top1_hit_rate": round(top1_hits / valid_groups, 4),
        "top3_hit_rate": round(topk_hits / valid_groups, 4),
        "group_count": valid_groups,
    }


def append_metrics_history(history_path: Path, metrics: dict) -> None:
    ensure_dir(history_path.parent)
    history_record = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        **metrics,
    }
    with history_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(history_record, ensure_ascii=False) + "\n")


def train(df: pd.DataFrame, artifact_dir: Path, data_source: str) -> None:
    ensure_dir(artifact_dir)

    feature_columns = get_feature_columns(df)
    X = df[feature_columns]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=260,
        max_depth=8,
        min_samples_leaf=8,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)
    auc = roc_auc_score(y_test, probs)
    report = classification_report(y_test, preds, output_dict=True)

    eval_df = df.loc[X_test.index, [TARGET_COLUMN]].copy()
    if GROUP_COLUMN in df.columns:
        eval_df[GROUP_COLUMN] = df.loc[X_test.index, GROUP_COLUMN]
    eval_df["pred_score"] = probs
    topk = compute_topk_metrics(eval_df, k=3)

    model_path = artifact_dir / "recommender_model.joblib"
    metrics_path = artifact_dir / "metrics.json"
    history_path = artifact_dir / "metrics_history.jsonl"

    joblib.dump(model, model_path)

    metrics = {
        "auc": round(float(auc), 4),
        "accuracy": round(float(report.get("accuracy", 0.0)), 4),
        "precision": round(float(report.get("1", {}).get("precision", 0.0)), 4),
        "recall": round(float(report.get("1", {}).get("recall", 0.0)), 4),
        "f1": round(float(report.get("1", {}).get("f1-score", 0.0)), 4),
        "top1_hit_rate": topk["top1_hit_rate"],
        "top3_hit_rate": topk["top3_hit_rate"],
        "topk_group_count": topk["group_count"],
        "data_source": data_source,
        "sample_size": int(len(df)),
        "positive_rate": round(float(df[TARGET_COLUMN].mean()), 4),
        "feature_columns": feature_columns,
        "feature_importance": {
            col: round(float(score), 4)
            for col, score in zip(feature_columns, model.feature_importances_)
        },
    }

    metrics_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    append_metrics_history(history_path, metrics)

    print("[OK] Model saved:", model_path)
    print("[OK] Metrics saved:", metrics_path)
    print("[OK] Metrics history appended:", history_path)
    print(
        "[INFO] AUC:",
        metrics["auc"],
        "Accuracy:",
        metrics["accuracy"],
        "Top1:",
        metrics["top1_hit_rate"],
        "Top3:",
        metrics["top3_hit_rate"],
        "Data:",
        data_source,
    )


def main() -> None:
    args = parse_args()
    artifact_dir = Path(args.artifact_dir)

    df, source = load_or_prepare_data(args)
    train(df, artifact_dir, source)


if __name__ == "__main__":
    main()
