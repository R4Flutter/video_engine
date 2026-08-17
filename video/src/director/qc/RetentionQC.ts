// RetentionQC: pre-render gate with format-aware routing.
// Shorts keep the legacy feed/swipe checker.
// Long-form documentaries use the unified production-grade LongFormQC.
import type { QcFinding, QcReport, ShortPlan } from "../types.ts";
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import { runHookQC } from "./HookQC.ts";
import { runPacingQC } from "./PacingQC.ts";
import { runCuriosityQC } from "./CuriosityQC.ts";
import { runVisualQC } from "./VisualQC.ts";
import { runAudioQC } from "./AudioQC.ts";
import { runLoopQC } from "./LoopQC.ts";
import { runLongFormQC } from "./LongFormQC.ts";
import { clamp } from "../util.ts";

const SHORT_WEIGHTS = {
  hook: 0.34,
  pacing: 0.22,
  curiosity: 0.18,
  visualVariety: 0.12,
  audio: 0.07,
  loop: 0.07,
};

const isLongForm = (plan: ShortPlan) => plan.project.durationInSeconds >= 120;
const SEVERITY_ORDER = { FATAL: 0, HIGH: 1, MED: 2, LOW: 3, undefined: 4 } as const;

const sortFindings = (findings: QcFinding[]) => findings.sort((a, z) => {
  const sa = SEVERITY_ORDER[(a.severity ?? "undefined") as keyof typeof SEVERITY_ORDER];
  const sz = SEVERITY_ORDER[(z.severity ?? "undefined") as keyof typeof SEVERITY_ORDER];
  if (sa !== sz) return sa - sz;
  if (a.at === -1) return 1;
  if (z.at === -1) return -1;
  return a.at - z.at;
});

export const runRetentionQC = (
  plan: ShortPlan,
  curiosity: CuriosityState,
  firstVo: string,
): QcReport => {
  // A long-form episode is judged as a documentary, not as a Short stretched
  // to 19 minutes. Keep the legacy Short path completely isolated.
  if (isLongForm(plan)) return runLongFormQC(plan, curiosity, firstVo);

  const hook = runHookQC(plan, firstVo);
  const pacing = runPacingQC(plan);
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

  const scores = {
    hook: hook.score,
    pacing: pacing.score,
    curiosity: curio.score,
    visualVariety: visual.score,
    audio: audio.score,
    loop: loop.score,
  };

  const craft =
    scores.hook * SHORT_WEIGHTS.hook +
    scores.pacing * SHORT_WEIGHTS.pacing +
    scores.curiosity * SHORT_WEIGHTS.curiosity +
    scores.visualVariety * SHORT_WEIGHTS.visualVariety +
    scores.audio * SHORT_WEIGHTS.audio +
    scores.loop * SHORT_WEIGHTS.loop;

  const retentionScore = clamp((plan.projectedRetention / 0.5) * 10, 0, 10);
  return {
    video: {
      title: plan.project.title,
      duration: plan.project.durationInSeconds,
      beats: plan.beats.length,
    },
    findings,
    scores,
    projectedRetention: Number((plan.projectedRetention * 100).toFixed(1)),
    score: Number(clamp(craft * 0.55 + retentionScore * 0.45, 0, 10).toFixed(1)),
  };
};

export const blockers = (report: QcReport) =>
  report.findings.filter((f) => f.severity === "FATAL");
