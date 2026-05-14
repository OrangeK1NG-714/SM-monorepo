#!/usr/bin/env python3
"""
Build enriched training pairs by merging teacher_data.csv profile features.

Supports teacher id-name mapping from local BSON dump (recommended) or MongoDB.

Usage:
  python build_enriched_pairs.py
  python build_enriched_pairs.py --teacher-bson data/smdatabase/Teacher.bson
  python build_enriched_pairs.py --use-mongo-map --mongo-uri mongodb://127.0.0.1/ms-da-projects
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import pandas as pd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build enriched training pairs")
    parser.add_argument("--pairs", default="data/training_pairs.csv", help="Base training pairs csv")
    parser.add_argument("--teacher-data", default="data/teacher_data.csv", help="Teacher profile csv")
    parser.add_argument("--teacher-bson", default="data/smdatabase/Teacher.bson", help="Teacher.bson path")
    parser.add_argument("--use-mongo-map", action="store_true", help="Use MongoDB for teacher id-name map")
    parser.add_argument("--mongo-uri", default="mongodb://127.0.0.1/ms-da-projects", help="Mongo connection uri")
    parser.add_argument("--output", default="data/training_pairs_enriched.csv", help="Output csv path")
    return parser.parse_args()


def normalize_name(name: str) -> str:
    if not isinstance(name, str):
        return ""
    name = re.sub(r"\s+", "", name)
    name = name.replace("/", "")
    return name.strip().lower()


def score_text(text: str, keywords: list[str]) -> float:
    if not text:
        return 0.0
    hit = 0
    for kw in keywords:
        if kw in text:
            hit += 1
    return min(1.0, hit / max(1, len(keywords) * 0.35))


def build_teacher_feature_map(teacher_df: pd.DataFrame) -> dict:
    feature_map = {}

    ai_keywords = ["人工智能", "深度学习", "机器学习", "大模型", "多模态", "知识图谱", "数据挖掘", "计算机视觉", "nlp", "语音"]
    design_keywords = ["交互", "用户体验", "视觉设计", "前端", "产品设计", "数字媒体", "图形", "动画", "品牌", "游戏"]
    engineering_keywords = ["系统", "算法", "网络", "数据库", "云计算", "分布式", "软件", "程序设计", "开发"]

    for _, row in teacher_df.iterrows():
        name = row.get("姓名", "")
        research = str(row.get("研究领域", "") or "")
        teaching = str(row.get("教学情况", "") or "")
        merged = f"{research} {teaching}".lower()

        ai_score = score_text(merged, ai_keywords)
        design_score = score_text(merged, design_keywords)
        engineering_score = score_text(merged, engineering_keywords)
        profile_richness = min(1.0, len(merged) / 180)

        feature_map[normalize_name(name)] = {
            "teacher_ai_score": round(ai_score, 4),
            "teacher_design_score": round(design_score, 4),
            "teacher_engineering_score": round(engineering_score, 4),
            "teacher_profile_richness": round(profile_richness, 4),
        }

    return feature_map


def add_competition_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["teacher_id"] = out["teacher_id"].astype(str)

    counts = out.groupby("teacher_id").size().rename("teacher_choose_count")
    out = out.merge(counts, on="teacher_id", how="left")

    max_count = max(1, int(out["teacher_choose_count"].max()))
    out["competition_index"] = (out["teacher_choose_count"] / max_count).clip(0, 1)

    threshold = out["teacher_choose_count"].quantile(0.35)
    out["cold_teacher_flag"] = (out["teacher_choose_count"] <= threshold).astype(int)
    out["acceptance_safety"] = (1 - out["competition_index"]).clip(0, 1)

    out = out.drop(columns=["teacher_choose_count"])
    return out


def load_teacher_id_name_map_from_bson(teacher_bson_path: Path) -> dict:
    if not teacher_bson_path.exists():
        return {}

    from bson import decode_file_iter

    result = {}
    with teacher_bson_path.open("rb") as f:
        for doc in decode_file_iter(f):
            teacher_id = str(doc.get("teacherId", "")).strip()
            teacher_name = normalize_name(str(doc.get("name", "")))
            if teacher_id:
                result[teacher_id] = teacher_name
    return result


def load_teacher_id_name_map_from_mongo(mongo_uri: str) -> dict:
    from pymongo import MongoClient

    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    teacher_docs = list(db.Teacher.find({}, {"teacherId": 1, "name": 1}))

    result = {}
    for t in teacher_docs:
        teacher_id = str(t.get("teacherId", "")).strip()
        teacher_name = normalize_name(str(t.get("name", "")))
        if teacher_id:
            result[teacher_id] = teacher_name
    return result


def main() -> None:
    args = parse_args()

    pairs_path = Path(args.pairs)
    teacher_data_path = Path(args.teacher_data)
    output_path = Path(args.output)
    teacher_bson_path = Path(args.teacher_bson)

    if not pairs_path.exists():
        raise FileNotFoundError(f"training pairs not found: {pairs_path}")
    if not teacher_data_path.exists():
        raise FileNotFoundError(f"teacher data not found: {teacher_data_path}")

    pairs_df = pd.read_csv(pairs_path)
    teacher_df = pd.read_csv(teacher_data_path)

    teacher_feature_map = build_teacher_feature_map(teacher_df)

    if args.use_mongo_map:
        teacher_id_to_name = load_teacher_id_name_map_from_mongo(args.mongo_uri)
        id_map_source = "mongo"
    else:
        teacher_id_to_name = load_teacher_id_name_map_from_bson(teacher_bson_path)
        id_map_source = "bson"

    if not teacher_id_to_name:
        raise RuntimeError("No teacher id-name map found. Check Teacher.bson or use --use-mongo-map.")

    default_feature = {
        "teacher_ai_score": 0.2,
        "teacher_design_score": 0.2,
        "teacher_engineering_score": 0.2,
        "teacher_profile_richness": 0.2,
    }

    ai_scores = []
    design_scores = []
    eng_scores = []
    richness_scores = []

    mapped_rows = 0
    profile_hit_rows = 0

    for _, row in pairs_df.iterrows():
        teacher_id = str(row.get("teacher_id", "")).strip()
        normalized_name = teacher_id_to_name.get(teacher_id, "")
        if normalized_name:
            mapped_rows += 1

        features = teacher_feature_map.get(normalized_name, default_feature)
        if normalized_name in teacher_feature_map:
            profile_hit_rows += 1

        ai_scores.append(features["teacher_ai_score"])
        design_scores.append(features["teacher_design_score"])
        eng_scores.append(features["teacher_engineering_score"])
        richness_scores.append(features["teacher_profile_richness"])

    pairs_df["teacher_ai_score"] = ai_scores
    pairs_df["teacher_design_score"] = design_scores
    pairs_df["teacher_engineering_score"] = eng_scores
    pairs_df["teacher_profile_richness"] = richness_scores
    pairs_df = add_competition_features(pairs_df)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pairs_df.to_csv(output_path, index=False)

    total_rows = max(1, len(pairs_df))
    print(f"[OK] Enriched dataset saved: {output_path}")
    print(f"[INFO] ID map source: {id_map_source}")
    print(f"[INFO] Rows: {len(pairs_df)}")
    print(f"[INFO] TeacherId mapped rows: {mapped_rows} ({mapped_rows / total_rows:.2%})")
    print(f"[INFO] Teacher profile hit rows: {profile_hit_rows} ({profile_hit_rows / total_rows:.2%})")


if __name__ == "__main__":
    main()
