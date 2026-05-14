#!/usr/bin/env python3
"""
Unified pipeline for ai-model training workflow.

Examples:
  python run_pipeline.py --mode base
  python run_pipeline.py --mode enriched
  python run_pipeline.py --mode mongo
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run ai-model pipeline")
    parser.add_argument("--mode", choices=["base", "enriched", "mongo"], default="enriched")
    parser.add_argument("--mongo-uri", default="mongodb://127.0.0.1/ms-da-projects")
    return parser.parse_args()


def run(cmd: list[str], cwd: Path) -> None:
    print("[RUN]", " ".join(cmd))
    subprocess.run(cmd, cwd=str(cwd), check=True)


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent
    python = sys.executable

    if args.mode == "base":
        run([python, "train_recommender.py", "--data-path", "data/training_pairs.csv"], root)
    elif args.mode == "enriched":
        run(
            [
                python,
                "build_enriched_pairs.py",
                "--pairs",
                "data/training_pairs.csv",
                "--teacher-data",
                "data/teacher_data.csv",
                "--teacher-bson",
                "data/smdatabase/Teacher.bson",
                "--output",
                "data/training_pairs_enriched.csv",
            ],
            root,
        )
        run([python, "train_recommender.py", "--data-path", "data/training_pairs_enriched.csv"], root)
    else:
        run([python, "train_recommender.py", "--from-mongo", "--mongo-uri", args.mongo_uri], root)

    run([python, "evaluate_latest.py"], root)


if __name__ == "__main__":
    main()
