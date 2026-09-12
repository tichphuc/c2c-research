import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const templatesDir = path.join(root, "research", "templates");

function readRepoFile(...parts: string[]): string {
  return fs.readFileSync(path.join(root, ...parts), "utf8");
}

function section(text: string, heading: string, nextHeading: string): string {
  const start = text.indexOf(heading);
  const end = text.indexOf(nextHeading, start + heading.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return text.slice(start, end);
}

describe("C2C Research mode skill invariants", () => {
  const skill = readRepoFile("skill", "SKILL.md");

  it("preserves SOFTWARE as the default mode for ordinary work", () => {
    const operatingMode = section(skill, "## Operating Mode", "## Research Boot");

    expect(operatingMode).toContain("`MODE: SOFTWARE`");
    expect(operatingMode).toMatch(/Default to `MODE: SOFTWARE`/);
    expect(operatingMode).toMatch(/Ambiguous coding, debugging, data-processing,\s+or data-analysis tasks stay in `MODE: SOFTWARE`/);
    expect(operatingMode).toMatch(/Enter `MODE: RESEARCH` only when the user explicitly asks/);
  });

  it("contains the expected Research Mode sections", () => {
    for (const heading of [
      "## Operating Mode",
      "## Research Boot",
      "## Research Scaffold",
      "## Research Hypotheses",
      "## Research Experiments",
      "## Research Runs",
      "## Research Review Gate",
    ]) {
      expect(skill).toContain(heading);
    }
  });

  it("keeps scientific memory as workspace state, not repository test state", () => {
    expect(fs.existsSync(path.join(root, ".research"))).toBe(false);
    expect(fs.existsSync(templatesDir)).toBe(true);
  });

  it("states the Research Mode safety rules", () => {
    expect(skill).toMatch(/single successful run must not automatically set a hypothesis to `supported`/);
    expect(skill).toMatch(/Preserve negative or contradictory\s+results/);
    expect(skill).toMatch(/experiment contract must exist before Codex runs the experiment/);
    expect(skill).toMatch(/important\s+research results must be persisted in `.research\/`/);
    expect(skill).toMatch(/Before ChatGPT returns `DONE`.*independently\s+inspect available evidence through MCP/s);
    expect(skill).toMatch(/must return\s+another `PLAN` with the minimal next scientific action/);
  });
});

describe("C2C Research template assets", () => {
  const expectedTemplates = [
    "research.yaml",
    "data_manifest.yaml",
    "baselines.yaml",
    "hypothesis.yaml",
    "experiment.yaml",
    "metrics.json",
    "provenance.json",
    "scientific_log.md",
  ];

  it("ships the expected reusable templates", () => {
    for (const file of expectedTemplates) {
      expect(fs.existsSync(path.join(templatesDir, file))).toBe(true);
    }
  });

  it("keeps JSON run templates valid and identifiable", () => {
    const metrics = JSON.parse(readRepoFile("research", "templates", "metrics.json"));
    const provenance = JSON.parse(readRepoFile("research", "templates", "provenance.json"));

    expect(metrics).toHaveProperty("experiment");
    expect(metrics).toHaveProperty("run");
    expect(metrics).toHaveProperty("metrics");

    for (const key of ["experiment", "run", "git_commit", "dataset_version", "config", "seed", "command"]) {
      expect(provenance).toHaveProperty(key);
    }
  });

  it("keeps the hypothesis template contract minimal and stable", () => {
    const hypothesis = readRepoFile("research", "templates", "hypothesis.yaml");

    expect(hypothesis).toContain("hypothesis_id: H001");
    for (const field of [
      "statement",
      "status",
      "supporting_experiments",
      "contradicting_experiments",
      "decision",
    ]) {
      expect(hypothesis).toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it("keeps the experiment template contract minimal and stable", () => {
    const experiment = readRepoFile("research", "templates", "experiment.yaml");

    expect(experiment).toContain("experiment_id: E001");
    expect(experiment).toContain("hypothesis: H001");
    for (const field of [
      "question",
      "control",
      "treatment",
      "controlled_variables",
      "metrics",
      "success_criteria",
    ]) {
      expect(experiment).toMatch(new RegExp(`\\b${field}\\b`));
    }
  });
});
