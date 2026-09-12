# C2C Research v0.1 — Implementation Specification

## 1. Goal

C2C Research v0.1 proves that the existing Codex-with-ChatGPT architecture
can support a scientific research workflow without modifying the MCP backend
or the existing C2C protocol state machine.

Core principle:

> ChatGPT reasons scientifically. Codex executes. Evidence decides.

---

## 2. Compatibility requirement

Existing software behavior MUST remain unchanged.

Two operating modes are defined:

- `MODE: SOFTWARE`
- `MODE: RESEARCH`

`SOFTWARE` remains the default.

Research Mode is activated only when the user explicitly requests:

- C2C Research
- Research Mode
- scientific experiment workflow
- equivalent explicit research-oriented use

Ambiguous tasks MUST remain in SOFTWARE mode.

---

## 3. Existing C2C state machine must remain unchanged

Do NOT add new protocol states.

Keep:

```text
INIT
  ↓
PLAN
  ↓
EXECUTING
  ↓
EXECUTED
  ↓
REVIEW
  ↓
PLAN | DONE | BLOCKED | ERROR
```

Research information is expressed only through additional headers.

Example:

```text
[C2C]
STATE: PLAN
MODE: RESEARCH
PHASE: EXPERIMENT_DESIGN
TASK_ID: ...
ITERATION: ...
HYPOTHESIS: H001
EXPERIMENT: E001
```

Allowed initial research phases:

```text
RESEARCH_DESIGN
EXPERIMENT_DESIGN
EXECUTION
SCIENTIFIC_REVIEW
```

Control messages remain concise.

Long scientific information belongs in `.research/`, not in C2C messages.

---

## 4. Roles

### ChatGPT

In Research Mode, ChatGPT acts as:

- Scientific Architect
- Hypothesis Designer
- Experiment Designer
- Scientific Reviewer
- Evidence Interpreter

ChatGPT remains read-only.

ChatGPT MUST NOT:

- edit files;
- run shell commands;
- alter data;
- change experiment configuration directly;
- claim scientific success only because Codex reports success.

### Codex

Codex acts as:

- Research Software Engineer
- Experiment Executor
- Data Processing Agent
- Reproducibility Recorder

Codex owns execution:

- file writes;
- shell commands;
- preprocessing;
- model training;
- tests;
- experiment execution;
- artifact generation.

Codex MUST NOT independently declare a scientific hypothesis supported.

---

## 5. Scientific memory layer

Every Research Mode workspace uses:

```text
.research/
├── research.yaml
├── data_manifest.yaml
├── baselines.yaml
│
├── hypotheses/
│   └── H001.yaml
│
├── experiments/
│   └── E001.yaml
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

`.research/` is the canonical scientific memory.

Conversation history is NOT the canonical project state.

A new session must be able to inspect `.research/` and recover:

- research question;
- active hypotheses;
- completed experiments;
- current evidence;
- current decision;
- next expected experiment.

---

## 6. Research bootstrap

When Research Mode starts and `.research/` does not exist, ChatGPT should
first plan creation of the scientific memory scaffold.

Before substantial model implementation, the research state should define
at least:

1. research question;
2. hypothesis or hypotheses;
3. target variable;
4. data sources;
5. baseline;
6. validation strategy;
7. primary metric;
8. reproducibility requirements.

Do not begin complex implementation before the essential research design is
recorded.

---

## 7. Hypothesis contract

Each hypothesis receives a stable ID:

```text
H001
H002
H003
...
```

Example:

```yaml
hypothesis_id: H001

statement:
  CYGNSS contributes useful predictive information beyond
  Sentinel-1, Sentinel-2 and meteorological predictors.

status: proposed

supporting_experiments: []
contradicting_experiments: []

decision: unresolved
```

Initial statuses:

```text
proposed
testing
supported
partially_supported
not_supported
rejected
superseded
```

A single successful run must not automatically change a hypothesis to
`supported`.

---

## 8. Experiment contract

Every experiment must have a stable ID:

```text
E001
E002
E003
...
```

The experiment contract must exist before execution.

Minimum example:

```yaml
experiment_id: E001
hypothesis: H001

question:
  Does treatment outperform the defined baseline?

control:
  baseline configuration

treatment:
  proposed configuration

controlled_variables:
  preprocessing: identical
  split: identical

metrics:
  - RMSE
  - MAE
  - R2

success_criteria:
  primary_metric: RMSE
```

Codex may implement the contract but must not silently modify the hypothesis,
control/treatment definition, or success criteria after observing results.

A material change creates a new experiment or explicit new version.

---

## 9. Run artifacts

An executed experiment should produce machine-readable evidence.

Minimum v0.1 artifacts:

```text
metrics.json
provenance.json
summary.md
```

`diagnostics.json` is recommended when appropriate.

Example `metrics.json`:

```json
{
  "experiment": "E001",
  "run": "run_001",
  "metrics": {
    "rmse": 0.052,
    "mae": 0.037,
    "r2": 0.78
  }
}
```

Example `provenance.json`:

```json
{
  "experiment": "E001",
  "run": "run_001",
  "git_commit": "...",
  "dataset_version": "...",
  "config": "...",
  "seed": 42,
  "command": "..."
}
```

---

## 10. Evidence-first review

ChatGPT must independently inspect available evidence through MCP.

Do not accept statements such as:

```text
"The model improved significantly."
```

without inspecting corresponding artifacts.

At minimum, review:

- experiment contract;
- metrics;
- provenance;
- relevant source diff;
- execution/test information where available.

The scientific decision must be derived from evidence, not agent claims.

Negative results are valid results and must not be discarded.

---

## 11. v0.1 scientific review gate

Before returning `DONE` for a research iteration, ChatGPT checks:

### Implementation

- expected code/artifacts exist;
- no obvious unexpected changes;
- required execution completed.

### Experiment

- experiment corresponds to the stated hypothesis;
- control and treatment are identifiable;
- required metrics exist.

### Evidence

- result is based on saved metrics;
- provenance exists;
- no unsupported scientific claim is made.

### Reproducibility

At least the following should be recoverable when applicable:

- experiment ID;
- configuration;
- data version/reference;
- seed;
- git commit;
- execution command.

If evidence is insufficient, ChatGPT returns another `PLAN`, not `DONE`.

Full uncertainty, multi-seed, spatial/temporal validation and advanced
scientific gates are deferred to v0.2.

---

## 12. Scientific decision log

Research decisions are stored in:

```text
.research/decisions/scientific_log.md
```

Example:

```markdown
## D001

Experiment:
E001

Observation:
Treatment reduced RMSE relative to baseline.

Limitation:
Evidence is from a single validation split.

Decision:
Do not accept H001 as fully supported.

Next:
Design E002 for stronger validation.
```

Failures and contradictory evidence must also be recorded.

---

## 13. Skill changes required

Primary implementation target:

```text
skill/SKILL.md
```

Required additions:

1. mode detection;
2. Research Mode role definition;
3. Research Boot Prompt;
4. `.research/` bootstrap instructions;
5. hypothesis and experiment ID rules;
6. evidence-first scientific review rules;
7. optional `MODE`, `PHASE`, `HYPOTHESIS`, `EXPERIMENT` protocol headers.

Existing SOFTWARE mode behavior must remain compatible with upstream.

---

## 14. Template assets

v0.1 may add reusable templates under:

```text
research/templates/
```

Suggested files:

```text
research.yaml
data_manifest.yaml
baselines.yaml
hypothesis.yaml
experiment.yaml
metrics.json
provenance.json
scientific_log.md
```

These are templates only.

No research-specific MCP tools are added in v0.1.

---

## 15. Out of scope for v0.1

Do NOT implement yet:

- custom `research_*` MCP tools;
- new C2C protocol states;
- hypothesis graph engine;
- experiment DAG engine;
- dashboard;
- automatic paper writing;
- automatic literature review;
- automatic statistical significance engine;
- multi-agent research orchestration;
- automatic solution for the current `iab` availability issue.

Research Mode must work with either automatic or manual C2C handoff.

---

## 16. Acceptance tests

### A. Software regression

Run an ordinary software task.

Expected:

- existing C2C behavior remains unchanged;
- no `.research/` directory is created;
- no research headers are required.

### B. Research bootstrap

Explicitly request Research Mode in a clean test project.

Expected:

- Research Mode is recognized;
- ChatGPT plans `.research/` creation;
- required research metadata is initialized.

### C. Experiment lifecycle

Define H001 and E001.

Expected:

```text
INIT
→ PLAN
→ Codex execution
→ EXECUTED
→ ChatGPT evidence review
→ DONE or next PLAN
```

### D. Evidence inspection

ChatGPT must read experiment artifacts through the existing generic MCP tools.

It must not require Codex to paste file contents into the control message.

### E. Negative result

Provide an experiment whose result fails its success criterion.

Expected:

- system records the negative result;
- ChatGPT does not falsely declare hypothesis success;
- next action may be another experiment.

### F. Session recovery

Start a new session after at least one completed experiment.

Expected:

- `.research/` is sufficient to recover the current research state.

---

## 17. Definition of Done for v0.1

v0.1 is complete when:

- SOFTWARE mode still behaves like upstream;
- explicit RESEARCH mode works;
- `.research/` can be bootstrapped;
- hypotheses have stable IDs;
- experiments have stable IDs;
- Codex can execute one experiment;
- metrics and provenance are persisted;
- ChatGPT independently reviews evidence through existing MCP tools;
- ChatGPT can return another PLAN when evidence is insufficient;
- negative results are retained;
- a new session can recover research state from `.research/`;
- no custom research MCP tool is required.

---

## 18. Implementation order

Implement in this order:

```text
1. Skill mode detection
2. Research Boot Prompt
3. Research templates
4. .research scaffold behavior
5. Hypothesis contract
6. Experiment contract
7. Run artifacts
8. Scientific review gate
9. Regression tests
10. Pilot project
```

Do not expand scope until v0.1 acceptance tests pass.
