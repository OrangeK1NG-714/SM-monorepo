# 学生-导师匹配模型：微调、验证、数据集与 PDF 接入指南

> 适用目录：`d:\桌面\数媒双选-uni\three\ai-model`

---

## 0. 先回答你的问题（简明版）

### Q1：我要怎么微调和验证？
可以。你现在这套不是大语言模型微调，而是**推荐模型重训/调参**。流程是：
1. 更新训练数据（真实样本）
2. 重新训练模型
3. 看验证指标（AUC、Top3 命中等）
4. 与上一版指标对比，决定是否上线

### Q2：我的数据集放在哪里？
建议放在：
- `ai-model/data/training_pairs.csv`（训练主数据）
- `ai-model/artifacts/metrics.json`（每次训练指标）

你现在脚本默认也是这个位置。

### Q3：可以喂老师 PDF 吗？
可以，建议做成**特征增强**，不是直接喂给模型原文。
- 从 PDF 提取导师方向关键词（如「交互设计」「3D建模」「视觉传达」）
- 转成结构化特征（关键词标签、方向分布、相似度分）
- 再和学生信息做匹配

### Q4：能否根据学生信息匹配老师？
可以，这正是你当前模型在做的事。后续可通过“学生标签 + 导师 PDF 标签”进一步提升准确度。

---

## 1. 推荐你现在使用的“微调”定义

你当前场景下，“微调”建议理解为：

1. **重训（Retrain）**：用最新历史数据重新训练
2. **特征微调（Feature Tuning）**：新增/修改特征（例如 PDF 关键词匹配）
3. **参数调优（Hyperparameter Tuning）**：调整树模型参数

> 不建议你现在去做大模型 LoRA 微调，投入高、收益低、维护重。

---

## 2. 数据集设计（你应该长期维护）

## 2.1 训练样本格式（推荐）
每一行 = 一个 `student-teacher` 候选对。

核心列建议：
- `student_id`
- `teacher_id`
- `activity_id`
- `direction_match`（方向匹配分，0~1）
- `teacher_capacity_ratio`（导师容量压力，0~1）
- `teacher_popularity`（导师热度，0~1）
- `history_accept_rate`（历史接收倾向，0~1）
- `gpa_level`（标准化后，0~1）
- `portfolio_score`（作品质量分，0~1）
- `student_priority`（1/2/3）
- `same_track`（是否同方向，0/1）
- `label`（是否最终匹配，0/1）

## 2.2 目录建议

```text
ai-model/
  data/
    training_pairs.csv
    teacher_pdf_profiles.csv
    student_profiles.csv
  artifacts/
    recommender_model.joblib
    metrics.json
    metrics_history.jsonl
```

---

## 3. 如何做验证（重点）

## 3.1 最低限度要看的指标
- `AUC`：整体排序能力
- `Precision@3`：推荐 Top3 的准确率
- `Recall@3`：是否能把最终匹配老师排进 Top3
- `采纳率`（线上）：学生是否采纳推荐

> 你目前 `metrics.json` 里已有 AUC/accuracy/precision/recall/f1，建议下一步补 TopK 指标。

## 3.2 验证切分建议

优先用“按活动/时间切分”，不要只随机切分：
- 训练集：历史活动
- 验证集：最近活动

这样更接近真实上线场景。

## 3.3 上线判定建议（简单门槛）
- 新模型 AUC 不低于旧模型
- `Precision@3` 至少提升 3%
- 热门导师过度集中现象不恶化

---

## 4. 什么时候重训（你问的“何时微调”）

满足任一条件就重训：
1. 新增真实样本 > 200 条
2. 新活动开始，导师结构变化明显
3. 线上采纳率下降 > 5%
4. 管理员反馈推荐明显偏差

建议节奏：
- 活动期：每周重训
- 平时：每月重训

---

## 5. 老师 PDF 怎么接入（可做，且很有价值）

## 5.1 目标
把导师简历/介绍 PDF 转为结构化标签，增强推荐质量。

## 5.2 处理流程
1. 收集 PDF：从现有上传路径汇总
2. 文本抽取：`pypdf/pdfplumber`
3. 关键词提取：领域词典 + TF-IDF（先别上重模型）
4. 生成导师画像：
   - `teacher_keywords`
   - `teacher_direction_vector`
   - `project_style_tag`
5. 与学生画像计算相似度：
   - `pdf_keyword_match_score`
6. 把该分数加入训练特征

## 5.3 PDF 放哪里
建议单独建目录（训练侧）：
- `ai-model/data/teacher_pdfs/`

如果要和线上复用，也可从后端已上传目录读取（例如现有 `resumePath`）再同步到训练目录。

## 5.4 注意事项
- 扫描件 PDF 可能需要 OCR
- 个人隐私字段（手机号等）要脱敏
- 不要把原文直接喂推荐模型，先结构化再使用

---

## 6. 你现在可以直接执行的命令

## 6.1 使用当前数据重训

```bash
python d:\桌面\数媒双选-uni\three\ai-model\train_recommender.py --from-mongo --mongo-uri mongodb://127.0.0.1/ms-da-projects
```

## 6.2 看训练指标

打开：
- `d:\桌面\数媒双选-uni\three\ai-model\artifacts\metrics.json`

## 6.3 验证预测示例

```bash
python d:\桌面\数媒双选-uni\three\ai-model\predict_demo.py
```

---

## 7. 下一阶段（后端 + 小程序）准备清单

你说最后要处理后端和小程序端，这里先给最小清单：

1. 后端新增：`POST /api/ai/recommend`
2. 后端读取模型并返回 Top3 + 理由模板
3. 小程序 `s_choose` 增加“AI推荐”按钮与结果卡片
4. 小程序提交“是否采纳”回传后端（用于下次重训）

---

## 8. 一句话建议

你现在先走：**结构化重训 + 指标验证 + PDF特征增强**。

这条路线最省钱、最稳、最适合你现在的项目阶段。等你把后端/小程序联调跑通后，再决定要不要引入更复杂的 RAG 或 LLM。
