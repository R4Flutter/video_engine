// RetentionQC: the pre-render gate.
// Format-aware: Shorts retain the existing swipe/feed model; long-form
// documentaries use chapter-aware pacing + a comparative completion proxy.
import type { QcFinding, QcReport, ShortPlan } from "../types.ts";
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import { runHookQC } from "./HookQC.ts";
import { runPacingQC } from "./PacingQC.ts";
import { runLongFormPacingQC } from "./LongFormPacingQC.ts";
import { runCuriosityQC } from "./CuriosityQC.ts";
import { runVisualQC } from "./VisualQC.ts";
import { runAudioQC } from "./AudioQC.ts";
import { runLoopQC } from "./LoopQC.ts";
import { runLongFormRetentionProxy } from "./LongFormRetention.ts";
import { clamp } from "../util.ts";

const SHORT_WEIGHTS = { hook: 0.34, pacing: 0.22, curiosity: 0.18, visualVariety: 0.12, audio: 0.07, loop: 0.07 };
const LONGFORM_WEIGHTS = { hook: 0.22, pacing: 0.24, curiosity: 0.22, visualVariety: 0.12, audio: 0.08, loop: 0.12 };
const SEVERITY_ORDER = { FATAL: 0, HIGH: 1, MED: 2, LOW: 3, undefined: 4 } as const;
const isLongForm = (plan: ShortPlan) => plan.project.durationInSeconds >= 120;

const sortFindings = (findings: QcFinding[]) => findings.sort((a, z) => {
  const sa = SEVERITY_ORDER[(a.severity ?? "undefined") as keyof typeof SEVERITY_ORDER];
  const sz = SEVERITY_ORDER[(z.severity ?? "undefined") as keyof typeof SEVERITY_ORDER];
  if (sa !== sz) return sa - sz;
  if (a.at === -1) return 1;
  if (z.at === -1) return -1;
  return a.at - z.at;
});

export const runRetentionQC = (plan: ShortPlan, curiosity: CuriosityState, firstVo: string): QcReport => {
  const longForm = isLongForm(plan);
  const hook = runHookQC(plan, firstVo);
  const pacing = longForm ? runLongFormPacingQC(plan) : runPacingQC(plan);
  const curio = runCuriosityQC(plan, curiosity);
  const visual = runVisualQC(plan);
  const audio = runAudioQC(plan);
  const loop = runLoopQC(plan);

  const findings = sortFindings([
    ...hook.findings,
    ...pacing.findings,
    ...curio.findings,
    ...visual.findings,
    ...audio.findings,
    ...loop.findings,
  ]);

  const scores = { hook: hook.score, pacing: pacing.score, curiosity: curio.score, visualVariety: visual.score, audio: audio.score, loop: loop.score };
  const W = longForm ? LONGFORM_WEIGHTS : SHORT_WEIGHTS;
  const craft = scores.hook * W.hook + scores.pacing * W.pacing + scores.curiosity * W.curiosity + scores.visualVariety * W.visualVariety + scores.audio * W.audio + scores.loop * W.loop;

  if (!longForm) {
    const retentionScore = clamp((plan.projectedRetention / 0.5) * 10, 0, 10);
    return {
      video: { title: plan.project.title, duration: plan.project.durationInSeconds, beats: plan.beats.length },
      findings,
      scores,
      projectedRetention: Number((plan.projectedRetention * 100).toFixed(1)),
      score: Number(clamp(craft * 0.55 + retentionScore * 0.45, 0, 10).toFixed(1)),
    };
  }

  const projectedRetention = runLongFormRetentionProxy(plan, curiosity, scores);
  const completionScore = clamp((projectedRetention / 0.5) * 10, 0, 10);
  const score = Number(clamp(craft * 0.70 + completionScore * 0.30, 0, 10).toFixed(1));

  return {
    video: { title: plan.project.title, duration: plan.project.durationInSeconds, beats: plan.beats.length },
    findings,
    scores,
    projectedRetention: Number((projectedRetention * 100).toFixed(1)),
    score,
  };
};

export const blockers = (report: QcReport) => report.findings.filter((f) => f.severity === "FATAL");
