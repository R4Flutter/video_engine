// LongFormQC: the production gate for documentary-length edits.
//
// This coordinator combines craft QC with explicit retention-engineering
// milestones. Retention signals are comparative QA heuristics, never a promise
// of YouTube performance.
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import type { QcFinding, QcReport, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";
import { runLongFormHookQC } from "./LongFormHookQC.ts";
import { runLongFormCuriosityQC } from "./LongFormCuriosityQC.ts";
import { runLongFormPacingQC } from "./LongFormPacingQC.ts";
import { runLongFormVisualQC } from "./LongFormVisualQC.ts";
import { runLongFormAudioQC } from "./LongFormAudioQC.ts";
import { runLongFormLoopQC } from "./LongFormLoopQC.ts";
import { runLongFormCompletionProxy } from "./LongFormCompletionProxy.ts";
import { runRetentionEngineeringQC } from "./RetentionEngineeringQC.ts";

const WEIGHTS = {
  hook: 0.20,
  pacing: 0.21,
  curiosity: 0.18,
  visualVariety: 0.11,
  audio: 0.07,
  loop: 0.10,
  retentionEngineering: 0.13,
};

const ORDER = { FATAL: 0, HIGH: 1, MED: 2, LOW: 3, undefined: 4 } as const;

const sortFindings = (findings: QcFinding[]) => findings.sort((a, b) => {
  const sa = ORDER[(a.severity ?? "undefined") as keyof typeof ORDER];
  const sb = ORDER[(b.severity ?? "undefined") as keyof typeof ORDER];
  if (sa !== sb) return sa - sb;
  if (a.at === -1) return 1;
  if (b.at === -1) return -1;
  return a.at - b.at;
});

const formatExpected = (plan: ShortPlan) => plan.project.durationInSeconds >= 120;

export const runLongFormQC = (
  plan: ShortPlan,
  curiosity: CuriosityState,
  firstVo: string,
): QcReport => {
  const findings: QcFinding[] = [];

  if (!formatExpected(plan)) {
    findings.push({
      at: -1,
      level: "warn",
      severity: "FATAL",
      rule: "longform-gate-misroute",
      message: `long-form QC received a ${plan.project.durationInSeconds.toFixed(1)}s plan`,
      reason: "the long-form gate must never be used as a disguised Shorts path.",
      fix: "route plans under 120s through the Short QC instead.",
    });
  }

  if (plan.project.engine !== "finance") {
    findings.push({
      at: -1,
      level: "info",
      severity: "LOW",
      rule: "longform-nonfinance-engine",
      message: `engine is "${plan.project.engine}" rather than finance`,
      reason: "this gate is generic enough to work for documentary essays, but finance-specific proof expectations may differ by engine.",
      fix: "no action unless the episode is intended to use the finance engine.",
    });
  }

  const hook = runLongFormHookQC(plan, firstVo);
  const pacing = runLongFormPacingQC(plan);
  const curiosityScore = runLongFormCuriosityQC(plan, curiosity);
  const visual = runLongFormVisualQC(plan);
  const audio = runLongFormAudioQC(plan);
  const loop = runLongFormLoopQC(plan);
  const retention = runRetentionEngineeringQC(plan);

  findings.push(
    ...hook.findings,
    ...pacing.findings,
    ...curiosityScore.findings,
    ...visual.findings,
    ...audio.findings,
    ...loop.findings,
    ...retention.findings,
  );

  const scores = {
    hook: hook.score,
    pacing: pacing.score,
    curiosity: curiosityScore.score,
    visualVariety: visual.score,
    audio: audio.score,
    loop: loop.score,
    retentionEngineering: retention.score,
  };

  const craft =
    scores.hook * WEIGHTS.hook +
    scores.pacing * WEIGHTS.pacing +
    scores.curiosity * WEIGHTS.curiosity +
    scores.visualVariety * WEIGHTS.visualVariety +
    scores.audio * WEIGHTS.audio +
    scores.loop * WEIGHTS.loop +
    scores.retentionEngineering * WEIGHTS.retentionEngineering;

  const projectedRetention = runLongFormCompletionProxy(plan, curiosity, scores);
  const completionScore = clamp(projectedRetention / 0.5, 0, 1) * 10;
  const score = Number(clamp(craft * 0.82 + completionScore * 0.18, 0, 10).toFixed(1));

  return {
    video: {
      title: plan.project.title,
      duration: plan.project.durationInSeconds,
      beats: plan.beats.length,
    },
    findings: sortFindings(findings),
    scores,
    projectedRetention: Number((projectedRetention * 100).toFixed(1)),
    score,
  };
};
