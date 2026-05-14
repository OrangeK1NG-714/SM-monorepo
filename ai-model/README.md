# ai-model（重构版）

本目录用于学生-导师互选推荐模型训练，采用“数据构建 + 训练 + 评估”三段式流程。

## 目录说明

- `run_pipeline.py`：统一入口（base/enriched/mongo）
- `build_enriched_pairs.py`：融合 `teacher_data.csv` 与 `smdatabase/Teacher.bson`，构建增强数据
- `train_recommender.py`：训练模型并输出指标
- `evaluate_latest.py`：快速解读当前指标质量
- `predict_demo.py`：读取当前模型和特征列进行演示预测
- `data/training_pairs.csv`：基础训练集
- `data/training_pairs_enriched.csv`：增强训练集
- `data/teacher_data.csv`：教师文本信息数据
- `data/smdatabase/`：导出的 BSON 数据
- `artifacts/recommender_model.joblib`：模型文件
- `artifacts/metrics.json`：最新指标
- `artifacts/metrics_history.jsonl`：历史指标追踪

## 安装依赖

```bash
pip install -r requirements.txt
```

## 一键流程（推荐）

### 1) 增强版训练（推荐）

```bash
python run_pipeline.py --mode enriched
```

### 2) 基础版训练

```bash
python run_pipeline.py --mode base
```

### 3) 从 Mongo 直出训练集并训练

```bash
python run_pipeline.py --mode mongo --mongo-uri mongodb://127.0.0.1/ms-da-projects
```

## 分步执行（可调试）

```bash
python build_enriched_pairs.py --pairs data/training_pairs.csv --teacher-data data/teacher_data.csv --teacher-bson data/smdatabase/Teacher.bson --output data/training_pairs_enriched.csv
python train_recommender.py --data-path data/training_pairs_enriched.csv
python evaluate_latest.py
python predict_demo.py
```

## 关注指标

优先看：
- `top3_hit_rate`
- `auc`
- `precision / recall`
- `topk_group_count`（过小会让 TopK 偏乐观）

上线建议：新模型 `auc` 和 `top3_hit_rate` 不低于上一版。
