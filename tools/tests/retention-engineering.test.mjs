import test from "node:test";
import assert from "node:assert/strict";
import { runRetentionEngineeringQC } from "../../video/src/director/qc/RetentionEngineeringQC.ts";

const basePlan = {
  project: { durationInSeconds: 900 },
  beats: [{ n: 1, start: 0, end: 12 }],
  attentionEvents: [],
  loop: { closes: false },
};

test("retention engineering flags an empty opening", () => {
  const report = runRetentionEngineeringQC(basePlan);
  assert.ok(report.findings.some((f) => f.rule === "retention-0-2-first-event"));
  assert.ok(report.findings.some((f) => f.rule === "retention-2-5-second-event"));
});

test("retention engineering accepts a properly staged opening", () => {
  const plan = {
    ...basePlan,
    attentionEvents: [
      { at: 0, type: "CONTRADICTION", beat: 1, strength: 1 },
      { at: 2.5, type: "NUMBER_REVEAL", beat: 1, strength: 1 },
      { at: 4.5, type: "QUESTION", beat: 1, strength: 1 },
      { at: 8, type: "REVEAL", beat: 1, strength: 1 },
      { at: 30, type: "PAYOFF", beat: 1, strength: 1 },
      { at: 35, type: "QUESTION", beat: 1, strength: 1 },
      { at: 800, type: "PAYOFF", beat: 1, strength: 1 },
    ],
    loop: { closes: true },
  };
  const report = runRetentionEngineeringQC(plan);
  assert.ok(report.score >= 8);
});
