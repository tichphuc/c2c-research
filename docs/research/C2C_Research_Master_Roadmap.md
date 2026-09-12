# C2C Research — Master Roadmap & Implementation Memory

**Project:** C2C Research  
**Base project:** `XiaoDuoYa/codex-with-chatgpt`  
**Created:** 2026-09-11  
**Purpose:** Bản ghi nhớ kỹ thuật và lộ trình triển khai chi tiết, dùng làm **source of truth** xuyên suốt quá trình phát triển để tránh mất mạch, đổi kiến trúc tùy hứng hoặc quên các quyết định đã thống nhất.

---

# 1. Tầm nhìn

Mục tiêu không phải chỉ tạo ra một coding agent mạnh hơn.

Mục tiêu là xây dựng một **AI Scientific Research Loop** trong đó:

- **ChatGPT** đóng vai trò:
  - Scientific Architect
  - Principal Investigator–like reasoning layer
  - Hypothesis Designer
  - Experiment Designer
  - Scientific Reviewer
  - Evidence Interpreter
  - Research Decision Maker

- **Codex** đóng vai trò:
  - Research Software Engineer
  - Experiment Executor
  - Data Processing Engineer
  - Model Implementation Agent
  - Test Runner
  - Reproducibility Recorder

- **`.research/`** đóng vai trò:
  - Machine-readable laboratory notebook
  - Scientific state store
  - Experiment registry
  - Provenance registry
  - Long-term project memory independent of conversation history

Nguyên tắc trung tâm:

> **ChatGPT thinks scientifically. Codex executes. Evidence decides.**

---

# 2. Kiến trúc gốc phải được giữ lại

Base architecture của `codex-with-chatgpt`:

```text
User
  ↓
ChatGPT
  ↓ PLAN
Codex
  ↓
Code / Shell / Tests / Git
  ↓
ChatGPT
  ↓ REVIEW
Codex
  ↓
DONE / next iteration
```

State machine gốc:

```text
INIT
  ↓
PLAN
  ↓
EXECUTED
  ↓
REVIEW
  ↓
PLAN / DONE
```

## Quyết định quan trọng

**KHÔNG thay đổi state machine gốc trong giai đoạn đầu.**

Không tạo các state mới như:

```text
RESEARCH_PLAN
EXPERIMENT
SCIENTIFIC_REVIEW
RESULT
```

Thay vào đó, giữ nguyên state machine và thêm metadata:

```text
MODE: RESEARCH
PHASE: RESEARCH_DESIGN
PHASE: EXPERIMENT_DESIGN
PHASE: EXECUTION
PHASE: SCIENTIFIC_VALIDATION
EXPERIMENT: E001
HYPOTHESIS: H001
```

Ví dụ:

```text
[C2C]
STATE: PLAN
MODE: RESEARCH
PHASE: EXPERIMENT_DESIGN
EXPERIMENT: E017
```

Lý do:

- không phá checkpoint/resume/handoff hiện có;
- giữ tương thích upstream;
- giảm phạm vi sửa code;
- dễ debug;
- dễ cập nhật upstream;
- tránh fork quá xa code gốc.

---

# 3. Mô hình Research Loop mục tiêu

```text
                    RESEARCH GOAL
                         │
                         ▼
              ┌─────────────────────┐
              │      ChatGPT        │
              │  Scientific Brain   │
              │                     │
              │ • research question │
              │ • hypothesis        │
              │ • novelty           │
              │ • experiment design │
              │ • validation        │
              └──────────┬──────────┘
                         │
                  RESEARCH PLAN
                         │
                         ▼
              ┌─────────────────────┐
              │       Codex         │
              │ Experiment Engineer │
              │                     │
              │ • preprocessing     │
              │ • implementation    │
              │ • training          │
              │ • tests             │
              │ • experiments       │
              └──────────┬──────────┘
                         │
                         ▼
                EXPERIMENT EVIDENCE
                         │
         ┌───────────────┼────────────────┐
         │               │                │
      metrics         configs         provenance
         │               │                │
         └───────────────┼────────────────┘
                         ▼
              ┌─────────────────────┐
              │      ChatGPT        │
              │ Scientific Reviewer │
              │                     │
              │ leakage?            │
              │ baseline?           │
              │ significance?       │
              │ uncertainty?        │
              │ generalization?     │
              └──────────┬──────────┘
                         │
                 ┌───────┴────────┐
                 ▼                ▼
          NEXT EXPERIMENT       DONE
```

---

# 4. Nguyên tắc phân quyền

## ChatGPT được phép

- đọc source code qua MCP;
- đọc `.research/`;
- đọc `git diff`;
- đọc test status;
- đọc execution output;
- đọc metrics;
- đọc provenance;
- so sánh experiments;
- thiết kế hypothesis;
- thiết kế validation;
- đề xuất experiment tiếp theo;
- đánh giá bằng chứng khoa học;
- quyết định có đủ điều kiện `DONE` hay chưa.

## ChatGPT KHÔNG được

- trực tiếp viết file;
- shell;
- delete;
- install packages;
- git commit;
- chạy experiment;
- chỉnh dữ liệu;
- tự thay đổi config thực thi.

## Codex được phép

- write/edit source code;
- shell;
- install;
- run tests;
- train model;
- preprocess;
- generate metrics;
- generate provenance;
- tạo artifacts;
- quản lý git theo workflow.

## Codex KHÔNG được tự quyết định

- hypothesis đúng hay sai;
- novelty đã đủ hay chưa;
- improvement có ý nghĩa khoa học hay không;
- experiment có chứng minh generalization hay không;
- có thể kết thúc nghiên cứu chỉ vì test pass.

---

# 5. Nguyên tắc evidence-first

Không chấp nhận kiểu:

```text
Codex:
"Model improved significantly."
```

ChatGPT phải tự đọc evidence.

Ví dụ:

```text
baseline RMSE = 0.061
new model RMSE = 0.052
```

chưa đủ.

Phải kiểm tra thêm:

```text
random split
spatial holdout
temporal holdout
multiple seeds
uncertainty
ablation
sample size
data leakage
```

Ví dụ:

```text
random split    RMSE = 0.052
spatial holdout RMSE = 0.067
```

Kết luận đúng phải là:

> Improvement trên random split chưa chứng minh được spatial generalization.

Sau đó tạo experiment mới thay vì `DONE`.

---

# 6. Quy trình cài đặt — Phase 0

## Mục tiêu

Cài **upstream nguyên bản** trước khi sửa bất cứ thứ gì.

## Nguyên tắc

Không fork trước khi biết bản gốc chạy.

Không sửa source upstream.

Không sửa MCP.

Không thêm Research Mode.

## Prompt cài upstream cho Codex

```text
Hãy cài đặt Codex with ChatGPT từ:
https://github.com/XiaoDuoYa/codex-with-chatgpt

Thực hiện toàn bộ quá trình tự động.

Yêu cầu:
- kiểm tra Git
- kiểm tra Node.js >= 20
- cài cloudflared nếu thiếu
- clone repo vào ~/codex-with-chatgpt
- chạy corepack pnpm install
- chạy corepack pnpm build
- cài skill vào ~/.codex/skills/codex-with-chatgpt/
- sửa đường dẫn checkout trong SKILL.md cho đúng
- chạy c2c sandbox-allow
- chạy c2c setup cho workspace hiện tại
- cấu hình ChatGPT connector theo đúng SKILL.md
- dùng built-in browser của Codex
- chỉ hỏi tôi khi cần login, CAPTCHA, 2FA hoặc thao tác bắt buộc của người dùng
- cuối cùng chạy c2c doctor và xác nhận file-read test thành công

Không sửa source code của codex-with-chatgpt ở bước này.
```

## Acceptance criteria Phase 0

Cần đạt:

```text
✓ Project detected
✓ Workspace Bridge started
✓ Secure connection established
✓ ChatGPT connected
✓ File read test passed
```

Sau đó chạy hai test.

### Test A — read-only

```text
Use Codex with ChatGPT to inspect this repository
and explain its architecture. Do not modify anything.
```

### Test B — write + review

```text
Use Codex with ChatGPT to add a tiny README improvement,
then let ChatGPT review the diff before finishing.
```

Chỉ chuyển Phase 1 khi cả hai workflow chạy ổn.

---

# 7. Fork strategy

Sau khi upstream chạy ổn:

```text
XiaoDuoYa/codex-with-chatgpt
        │
        ▼
OUR_GITHUB/codex-with-chatgpt-research
```

Clone fork riêng:

```text
~/codex-with-chatgpt-research
```

Giữ upstream original tại:

```text
~/codex-with-chatgpt
```

Remote strategy:

```text
origin   -> OUR_GITHUB/codex-with-chatgpt-research
upstream -> XiaoDuoYa/codex-with-chatgpt
```

Branch model:

```text
upstream/main
     ↓
our main
     ↓
research-mode
```

## Không được

- phát triển trực tiếp trên checkout upstream;
- dùng upstream checkout làm nơi chứa experimental modifications;
- để auto-update upstream overwrite Research Mode.

---

# 8. Auto-update policy

Một trong những sửa đổi đầu tiên của fork:

Upstream C2C có update-check / pull workflow.

Trong Research fork cần đổi:

```text
UPSTREAM UPDATE
      ↓
DETECT
      ↓
NOTIFY
      ↓
MANUAL REVIEW / MERGE
```

Không:

```text
AUTO-PULL
   ↓
overwrite research changes
```

Mục tiêu:

- vẫn nhận security fixes;
- vẫn theo được upstream;
- nhưng không để Research Mode bị update tự động phá.

---

# 9. Release roadmap

## C2C Research v0.1

Mục tiêu:

> Chứng minh Research Mode hoạt động mà gần như không sửa MCP/backend.

Bao gồm:

- upstream C2C;
- `MODE: RESEARCH`;
- Research Skill instructions;
- `.research/` scaffold;
- hypothesis;
- experiment contracts;
- metrics;
- provenance cơ bản;
- scientific review rules.

Không bao gồm:

- custom research MCP tools;
- hypothesis graph engine;
- dashboard;
- automatic paper generation.

---

## C2C Research v0.2

Bao gồm:

- standardized experiment contracts;
- reproducibility;
- data manifest;
- scientific gates;
- multi-seed experiments;
- ablation protocol;
- spatial holdout;
- temporal holdout;
- uncertainty reporting;
- scientific decision log.

---

## C2C Research v0.3

Thêm read-only MCP tools:

```text
research_status()
hypothesis_list()
experiment_list()
experiment_result(id)
compare_experiments(ids)
dataset_manifest()
run_provenance(run_id)
research_decisions()
```

Tất cả read-only.

---

## C2C Research v1.0

Mục tiêu dài hạn:

- hypothesis graph;
- experiment dependency graph;
- automatic experiment comparison;
- multi-experiment reasoning;
- research program state;
- paper-table traceability;
- result-to-figure provenance;
- result-to-paper provenance;
- scientific decision history.

---

# 10. Research Mode v0.1 — thay đổi Skill

Research Skill cần nhận biết hai mode:

```text
MODE: SOFTWARE
MODE: RESEARCH
```

### SOFTWARE

Giữ hành vi upstream.

### RESEARCH

ChatGPT role:

```text
Scientific Architect
Hypothesis Designer
Experiment Designer
Scientific Reviewer
Evidence Interpreter
```

Codex role:

```text
Research Software Engineer
Experiment Executor
```

---

# 11. Research Boot Prompt

Khi Research Mode khởi tạo, ChatGPT phải ưu tiên xác định:

```text
1. Research question
2. Hypotheses
3. Target variable
4. Data sources
5. Baselines
6. Validation strategy
7. Primary metrics
8. Secondary metrics
9. Ablation plan
10. Uncertainty plan
11. Generalization tests
12. Reproducibility requirements
13. Stopping criteria
```

Không được bắt đầu coding model trước khi ít nhất các mục cốt lõi đã được xác định.

---

# 12. `.research/` — Scientific Memory Layer

Canonical structure:

```text
.research/
├── research.yaml
├── data_manifest.yaml
├── baselines.yaml
│
├── hypotheses/
│   ├── H001.yaml
│   └── H002.yaml
│
├── experiments/
│   ├── E001.yaml
│   ├── E002.yaml
│   └── E003.yaml
│
├── runs/
│   └── E001/
│       └── run_001/
│           ├── metrics.json
│           ├── provenance.json
│           ├── diagnostics.json
│           └── summary.md
│
└── decisions/
    └── scientific_log.md
```

## Nguyên tắc

`.research/` là scientific memory chính.

Conversation memory KHÔNG được coi là nguồn duy nhất lưu trạng thái nghiên cứu.

Nếu mở lại project sau nhiều tuần:

```text
.research/
```

phải đủ để khôi phục:

- đang nghiên cứu câu hỏi gì;
- hypotheses hiện tại;
- experiment nào đã chạy;
- kết quả ra sao;
- kết luận tạm thời;
- experiment tiếp theo;
- vì sao quyết định như vậy.

---

# 13. `research.yaml`

Ví dụ:

```yaml
project:
  name: GNSS-R Drought Monitoring

research_question:
  Can multi-source GNSS-R and EO improve daily
  agricultural drought monitoring at 250 m?

hypotheses:

  H001:
    statement:
      CYGNSS improves soil-moisture estimation beyond
      SAR, optical and meteorological predictors.

  H002:
    statement:
      Physics-guided fusion improves spatial
      and temporal generalization.

  H003:
    statement:
      Learned representations transfer across
      hydroclimatic regions.

primary_metric:
  RMSE

secondary_metrics:
  - MAE
  - R2

validation:
  random_holdout: true
  spatial_holdout: true
  temporal_holdout: true
  cross_region: true

requirements:
  baselines: true
  ablation: true
  uncertainty: true
  multi_seed: true
  reproducibility: true
```

---

# 14. Hypothesis schema

Ví dụ:

```yaml
hypothesis_id: H001

statement:
  CYGNSS contributes independent information
  for drought estimation beyond Sentinel-1,
  Sentinel-2 and meteorological predictors.

status:
  proposed

supporting_experiments:
  []

contradicting_experiments:
  []

decision:
  unresolved
```

Possible status:

```text
proposed
testing
supported
partially_supported
not_supported
rejected
superseded
```

Không nên coi một experiment duy nhất là đủ để chuyển hypothesis thành `supported`.

---

# 15. Experiment Contract

Mỗi experiment phải tồn tại trước khi execute.

Ví dụ:

```yaml
experiment_id: E017

hypothesis: H001

question:
  Does CYGNSS add predictive information beyond
  Sentinel-1 + Sentinel-2 + meteorology?

control:
  Sentinel-1 + Sentinel-2 + meteorology

treatment:
  Sentinel-1 + Sentinel-2 + meteorology + CYGNSS

controlled_variables:
  architecture: identical
  preprocessing: identical
  train_split: identical

seeds:
  - 42
  - 123
  - 777
  - 2026
  - 2027

validation:
  - random_holdout
  - spatial_holdout
  - temporal_holdout

metrics:
  - RMSE
  - MAE
  - R2

stratification:
  - season
  - land_cover
  - soil_type

success_criteria:
  minimum_relative_rmse_improvement: 0.05
  must_hold_on_spatial_validation: true
```

## Nguyên tắc

Codex không được tự chỉnh:

- hypothesis;
- control/treatment definition;
- success criteria;

chỉ để làm kết quả đẹp hơn.

Nếu experiment contract cần thay đổi:

```text
ChatGPT review
    ↓
new version / new experiment
```

---

# 16. Metrics format

Ví dụ:

```json
{
  "experiment": "E017",
  "run": "run_001",
  "baseline": {
    "rmse": 0.061,
    "mae": 0.044,
    "r2": 0.71
  },
  "treatment": {
    "rmse": 0.052,
    "mae": 0.037,
    "r2": 0.78
  },
  "spatial_holdout": {
    "rmse": 0.067
  },
  "temporal_holdout": {
    "rmse": 0.056
  },
  "n": 28491
}
```

ChatGPT phải đọc file này thay vì chỉ tin execution summary của Codex.

---

# 17. Provenance schema

Mỗi run phải có:

```json
{
  "experiment": "E017",
  "run": "run_001",
  "git_commit": "a83fd21",
  "dataset_version": "soilmoisture_v3",
  "dataset_hash": "...",
  "config": "configs/E017.yaml",
  "python": "3.12.4",
  "pytorch": "2.x",
  "cuda": "...",
  "seed": 42,
  "command": "python train.py --config configs/E017.yaml"
}
```

Mục tiêu:

```text
Paper result
   ↓
Experiment
   ↓
Run
   ↓
Config
   ↓
Dataset version
   ↓
Git commit
   ↓
Exact command
```

---

# 18. Data policy

ChatGPT không nên đọc raw datasets lớn.

Ví dụ:

```text
100 GB CYGNSS NetCDF
```

Không:

```text
ChatGPT ← raw 100 GB
```

Nên:

```text
Raw data
   ↓
Codex
   ↓
compute summaries
   ↓
dataset_summary.json
qc_report.json
coverage_summary.json
sample_statistics.json
   ↓
ChatGPT
```

Mục tiêu:

- giảm token;
- giảm dữ liệu gửi không cần thiết;
- tăng tốc;
- cải thiện privacy;
- ép reasoning dựa trên meaningful summaries.

---

# 19. Scientific Review Gate

Software test pass KHÔNG đồng nghĩa scientific success.

Trước `DONE`, kiểm tra:

## Code Gate

```text
✓ tests pass
✓ pipeline executes
✓ no obvious implementation bug
```

## Data Gate

```text
✓ split valid
✓ leakage checked
✓ preprocessing documented
✓ missing-data handling documented
✓ QC documented
```

## Experiment Gate

```text
✓ baseline exists
✓ control/treatment valid
✓ ablation where appropriate
✓ multiple seeds where appropriate
```

## Robustness Gate

```text
✓ seed sensitivity
✓ uncertainty
✓ confidence intervals / variance
✓ sample sizes
```

## Generalization Gate

```text
✓ spatial holdout
✓ temporal holdout
✓ cross-region where relevant
```

## Scientific Gate

```text
✓ hypothesis directly evaluated
✓ alternative explanations considered
✓ result is not inferred only from training loss
✓ failures are recorded
```

## Reproducibility Gate

```text
✓ config
✓ seed
✓ git commit
✓ data version
✓ environment
✓ exact command
```

Chỉ khi required gates pass mới có thể:

```text
STATE: DONE
```

---

# 20. Failure is valid evidence

Research Mode KHÔNG được tối ưu chỉ để tạo kết quả tích cực.

Ví dụ hợp lệ:

```text
H001 not supported.
CYGNSS improves random split but not spatial holdout.
```

Kết quả âm phải được:

- lưu;
- ghi scientific decision;
- không xóa experiment;
- không cherry-pick chỉ experiment tốt;
- dùng để thiết kế hypothesis mới.

---

# 21. Scientific Decision Log

File:

```text
.research/decisions/scientific_log.md
```

Ví dụ:

```markdown
## D012 — 2026-09-XX

Experiment:
E017

Observation:
CYGNSS improves random-split RMSE by 14.8%.

Problem:
Improvement disappears under basin-level spatial holdout.

Interpretation:
Potential spatial leakage or location-specific representation.

Decision:
Do not accept H001 yet.

Next experiment:
E018 — basin-group holdout with identical architecture and preprocessing.
```

Decision log là reasoning memory cấp project.

---

# 22. Message protocol examples

## INIT

```text
[C2C]
STATE: INIT
MODE: RESEARCH
PHASE: RESEARCH_DESIGN

GOAL:
Develop a daily 250-m agricultural drought monitoring
model using CYGNSS, FY-3, Sentinel-1/2 and meteorological data.
```

## PLAN

```text
[C2C]
STATE: PLAN
MODE: RESEARCH
PHASE: EXPERIMENT_DESIGN

HYPOTHESIS:
H001

PRIMARY_EXPERIMENT:
E001

BASELINES:
RF
XGBoost
LSTM
Transformer

VALIDATION:
Spatial hold-out
Temporal hold-out
Cross-region

PRIMARY_METRICS:
RMSE
MAE
R2

SCIENTIFIC_CHECKS:
Data leakage
Uncertainty
Ablation
Seed sensitivity
```

## EXECUTED

```text
[C2C]
STATE: EXECUTED
MODE: RESEARCH
PHASE: EXPERIMENT
EXPERIMENT: E001

STATUS:
COMPLETE
```

Codex không paste massive logs.

ChatGPT tự pull evidence qua MCP.

## REVIEW → new experiment

```text
[C2C]
STATE: PLAN
MODE: RESEARCH
PHASE: SCIENTIFIC_VALIDATION

RATIONALE:
E001 improves random-split RMSE but performance
degrades substantially under spatial holdout.

NEXT_EXPERIMENT:
E002

PURPOSE:
Test whether apparent improvement originates
from spatial leakage.

ACTIONS:
- basin-level group split
- same architecture
- same hyperparameters
- same preprocessing
- seeds 42/123/777/2026/2027
```

---

# 23. MCP strategy

## v0.1–v0.2

Dùng MCP hiện tại:

```text
list_directory
read_file
search_workspace
git_diff
git_status
test_status
execution_summary
execution_output
```

ChatGPT đọc `.research/*.yaml`, `.json`, `.md` bằng generic file tools.

## v0.3

Thêm read-only tools:

```text
research_status()
hypothesis_list()
experiment_list()
experiment_result(id)
compare_experiments(ids)
dataset_manifest()
run_provenance(run_id)
research_decisions()
```

## Không tạo tool write

Không:

```text
run_experiment()
write_experiment()
modify_config()
delete_data()
shell()
git_commit()
```

Security principle:

> **ChatGPT stays read-only. Codex owns execution.**

---

# 24. Pilot project trước dữ liệu thật

Không bắt đầu trực tiếp bằng GNSS-R production pipeline.

Tạo:

```text
research-c2c-pilot/
```

Bài toán nhỏ:

```text
Question:
Does Model B outperform Model A?
```

Hypothesis:

```text
H001:
B reduces RMSE versus A.
```

Experiments:

```text
E001 baseline A
E002 model B
E003 spatial holdout
E004 ablation
E005 five random seeds
```

Pilot được coi thành công nếu tự chạy được:

```text
HYPOTHESIS
    ↓
EXPERIMENT DESIGN
    ↓
CODEX IMPLEMENTATION
    ↓
EXECUTION
    ↓
EVIDENCE
    ↓
CHATGPT SCIENTIFIC REVIEW
    ↓
NEW EXPERIMENT
```

Không yêu cầu user phải manually nhắc mỗi bước.

---

# 25. Production use case: GNSS-R / drought research

Sau pilot:

```text
GNSS-R-Drought/
├── data/
├── src/
├── models/
├── configs/
└── .research/
```

Possible high-level program:

```text
                   Drought Monitoring
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
      H1                 H2                 H3
GNSS-R contribution  Physics-guided      Transferability
       │                  │                  │
    E001-E010          E011-E020          E021-E030
                                               │
                                               ▼
                                              H4
                                    Drought forecasting
                                               │
                                      Transformer / Mamba
```

Các hướng nghiên cứu có thể chạy song song nhưng dùng chung:

- data provenance;
- common baselines;
- validation policies;
- spatial/temporal split definitions;
- reproducibility infrastructure.

---

# 26. Các câu hỏi khoa học Research Mode phải luôn hỏi

Trước khi tin một kết quả:

```text
Was the split valid?
Could there be leakage?
Was the baseline competitive?
Were hyperparameters controlled?
Did the treatment change anything else?
Is improvement robust across seeds?
Does it survive spatial holdout?
Does it survive temporal holdout?
Is uncertainty quantified?
Are failures reported?
Is the sample size meaningful?
Can the result be reproduced?
Could a simpler explanation account for the result?
```

---

# 27. Anti-patterns cần tránh

## Anti-pattern 1

```text
test passed → DONE
```

Sai trong research.

---

## Anti-pattern 2

```text
higher R² → novelty
```

Sai.

Novelty cần đánh giá riêng.

---

## Anti-pattern 3

Codex tự viết:

```text
This proves our proposed method is superior.
```

Không chấp nhận.

---

## Anti-pattern 4

Chỉ lưu output tốt.

Không được.

Negative results phải lưu.

---

## Anti-pattern 5

Sửa split/hyperparameter sau khi xem test result mà không ghi lại.

Phải tạo experiment mới hoặc version mới.

---

## Anti-pattern 6

ChatGPT đọc toàn bộ raw satellite data.

Không cần thiết.

---

## Anti-pattern 7

Fork quá sâu ngay ở version đầu.

Không nên.

Research Mode v0.1 ưu tiên Skill + `.research/`.

---

## Anti-pattern 8

Phá upstream state machine.

Không làm trong giai đoạn đầu.

---

# 28. Development sequence — canonical order

Thứ tự bắt buộc hiện tại:

```text
PHASE 0
Install upstream untouched
        ↓
PHASE 0B
Verify read-only + edit/review loop
        ↓
PHASE 1
Fork repository
        ↓
PHASE 1B
Disable unsafe auto-overwrite/update behavior
        ↓
PHASE 2
Research Mode in SKILL.md
        ↓
PHASE 3
.research scaffold
        ↓
PHASE 4
Experiment Contract
        ↓
PHASE 5
Metrics + Provenance
        ↓
PHASE 6
Scientific Gates
        ↓
PHASE 7
Pilot ML project
        ↓
PHASE 8
Review architecture based on pilot
        ↓
PHASE 9
Add custom research MCP tools
        ↓
PHASE 10
Apply to GNSS-R / drought project
        ↓
PHASE 11
Hypothesis graph + full v1.0
```

Không nhảy trực tiếp tới custom MCP trước khi v0.1 pilot chứng minh hữu ích.

---

# 29. Definition of Done — v0.1

v0.1 được coi là đạt khi:

1. Upstream C2C vẫn hoạt động bình thường ở `MODE: SOFTWARE`.
2. `MODE: RESEARCH` kích hoạt scientific workflow.
3. Research project được scaffold `.research/`.
4. ChatGPT có thể đọc research state.
5. ChatGPT thiết kế một experiment.
6. Codex implement và chạy experiment.
7. Codex ghi metrics + provenance.
8. ChatGPT tự đọc evidence.
9. ChatGPT có thể bác bỏ một kết quả tưởng như tích cực.
10. ChatGPT tạo experiment tiếp theo.
11. Scientific decision được ghi trong project.
12. Session mới có thể đọc `.research/` và tiếp tục đúng trạng thái cũ.

Nếu mục 12 không đạt, scientific memory layer chưa hoàn thành.

---

# 30. Definition of Done — v1.0

v1.0 hướng tới:

```text
Research question
       ↓
Hypothesis graph
       ↓
Experiment DAG
       ↓
Automated execution
       ↓
Evidence registry
       ↓
Scientific review
       ↓
Decision log
       ↓
Next experiment
       ↓
Paper-ready traceability
```

Tất cả result trong paper phải lần ngược được về:

```text
result
→ experiment
→ run
→ code
→ config
→ data
→ environment
→ command
```

---

# 31. Quy tắc khi roadmap thay đổi

File này là **source of truth**, nhưng không bất biến.

Mọi thay đổi lớn phải ghi:

```text
CHANGE
WHY
IMPACT
MIGRATION
DATE
```

Ví dụ:

```markdown
## Architecture Decision AD-003

Date:
2026-XX-XX

Change:
Add explicit SCIENTIFIC_REVIEW state.

Previous decision:
Keep upstream state machine unchanged.

Reason:
Pilot demonstrated metadata-only phases are insufficient.

Impact:
Requires protocol and checkpoint migration.

Migration:
...
```

Không thay đổi kiến trúc âm thầm.

---

# 32. Architecture Decision Records (ADR) ban đầu

## ADR-001 — Keep upstream state machine

**Decision:** giữ `INIT → PLAN → EXECUTED → REVIEW → DONE`.

**Reason:** tương thích upstream, giảm rủi ro, giảm code changes.

---

## ADR-002 — ChatGPT remains read-only

**Decision:** không trao quyền execution cho ChatGPT.

**Reason:** security, reproducibility, separation of concerns.

---

## ADR-003 — `.research/` is canonical scientific memory

**Decision:** trạng thái nghiên cứu không phụ thuộc conversation memory.

---

## ADR-004 — Evidence over agent claims

**Decision:** ChatGPT tự đọc metrics/provenance/diff/test.

---

## ADR-005 — Negative results are first-class artifacts

**Decision:** failure được lưu giống positive results.

---

## ADR-006 — Upstream installation before fork

**Decision:** phải xác nhận upstream hoạt động trước khi sửa.

---

## ADR-007 — Generic MCP first, specialized MCP later

**Decision:** v0.1 dùng file tools hiện tại; research MCP chỉ sau pilot.

---

# 33. Immediate next action

Việc tiếp theo duy nhất cần làm:

```text
INSTALL UPSTREAM C2C
```

Không sửa research code ở bước này.

Checklist:

```text
[ ] Git available
[ ] Node >= 20
[ ] cloudflared available
[ ] upstream cloned
[ ] pnpm install
[ ] pnpm build
[ ] Skill installed
[ ] c2c sandbox-allow
[ ] c2c setup
[ ] ChatGPT connector configured
[ ] c2c doctor
[ ] file-read test passes
[ ] small read-only workflow passes
[ ] small edit+review workflow passes
```

Chỉ sau đó:

```text
CREATE RESEARCH FORK
```

---

# 34. Working mantra

Trong toàn bộ quá trình, luôn quay lại bốn câu:

> **1. ChatGPT có đang reasoning khoa học hay chỉ coding?**  
> **2. Codex có đang execute thay vì tự kết luận khoa học không?**  
> **3. Kết luận có dựa trên evidence được lưu và tái lập không?**  
> **4. Một session mới có thể khôi phục toàn bộ trạng thái từ repository không?**

Nếu một thay đổi làm yếu một trong bốn nguyên tắc này, cần xem xét lại.

---

# 35. Final project philosophy

C2C Research không nhằm tự động hóa hoàn toàn khoa học.

Nó nhằm tạo ra một hệ thống trong đó:

```text
Human researcher
      ↓ goals / judgment
ChatGPT
      ↓ scientific reasoning
Codex
      ↓ reproducible execution
Evidence
      ↓
ChatGPT
      ↓ scientific critique
Human researcher
```

Con người vẫn giữ:

- mục tiêu khoa học;
- đánh giá ý nghĩa;
- quyết định công bố;
- đạo đức nghiên cứu;
- trách nhiệm cuối cùng.

AI hỗ trợ:

- systematization;
- implementation;
- experiment tracking;
- falsification;
- reproducibility;
- iterative reasoning.

---

# 36. Status

```text
CURRENT STATUS:
ROADMAP RECORDED

NEXT:
PHASE 0 — INSTALL AND VERIFY UPSTREAM C2C

DO NOT YET:
- modify MCP
- alter state machine
- implement hypothesis graph
- use production GNSS-R dataset
```

---

**End of master roadmap.**
