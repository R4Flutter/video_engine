// RetentionQC: the pre-render gate.
//
// Runs every check, weights the scores by what actually decides a Short, and
// returns one report. The weighting is the opinionated part and it is worth
// stating plainly: the hook is worth more than everything else combined,
// because no amount of good editing at second twenty reaches an audience that
// left at second one.
//
// The score is an internal heuristic. It exists to find the weak part of a
// cut before you spend twenty minutes rendering it — not to predict YouTube.
import type { QcFinding, QcReport, ShortPlan } from "../types.ts";
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import { runHookQC } from "./HookQC.ts";
import { runPacingQC } from "./PacingQC.ts";
import { runCuriosityQC } from "./CuriosityQC.ts";
import { runVisualQC } from "./VisualQC.ts";
import { runAudioQC } from "./AudioQC.ts";
import { runLoopQC } from "./LoopQC.ts";
import { clamp } from "../util.ts";

/** What decides a Short, as weights. Hook first, and not by a little. */
const WEIGHTS = {
  hook: 0.34,
  pacing: 0.22,
  curiosity: 0.18,
  visualVariety: 0.12,
  audio: 0.07,
  loop: 0.07,
};

const SEVERITY_ORDER = { FATAL: 0, HIGH: 1, MED: 2, LOW: 3, undefined: 4 } as const;

export const runRetentionQC = (
  plan: ShortPlan,
  curiosity: CuriosityState,
  firstVo: string,
): QcReport => {
  const hook = runHookQC(plan, firstVo);
  const pacing = runPacingQC(plan);
  const curio = runCuriosityQC(plan, curiosity);
  const visual = runVisualQC(plan);
  const audio = runAudioQC(plan);
  const loop = runLoopQC(plan);

  const findings: QcFinding[] = [
    ...hook.findings,
    ...pacing.findings,
    ...curio.findings,
    ...visual.findings,
    ...audio.findings,
    ...loop.findings,
  ].sort((a, z) => {
    // Severity first — an author reading top to bottom should hit the thing
    // that matters most, not the thing that happens earliest.
    const sa = SEVERITY_ORDER[(a.severity ?? "undefined") as keyof typeof SEVERITY_ORDER];
    const sz = SEVERITY_ORDER[(z.severity ?? "undefined") as keyof typeof SEVERITY_ORDER];
    if (sa !== sz) return sa - sz;
    if (a.at === -1) return 1;
    if (z.at === -1) return -1;
    return a.at - z.at;
  });

  const scores = {
    hook: hook.score,
    pacing: pacing.score,
    curiosity: curio.score,
    visualVariety: visual.score,
    audio: audio.score,
    loop: loop.score,
  };

  const craft =
    scores.hook * WEIGHTS.hook +
    scores.pacing * WEIGHTS.pacing +
    scores.curiosity * WEIGHTS.curiosity +
    scores.visualVariety * WEIGHTS.visualVariety +
    scores.audio * WEIGHTS.audio +
    scores.loop * WEIGHTS.loop;

  // The craft score and the retention estimate have to agree, or the report
  // is useless: a cut cannot be "8.3 out of 10" while a fifth of the audience
  // reaches the end. So the overall blends the two, with 50% projected
  // retention as the reference point for full marks.
  const retentionScore = clamp((plan.projectedRetention / 0.5) * 10, 0, 10);
  const score = Number(clamp(craft * 0.55 + retentionScore * 0.45, 0, 10).toFixed(1));

  return {
    video: {
      title: plan.project.title,
      duration: plan.project.durationInSeconds,
      beats: plan.beats.length,
    },
    findings,
    scores,
    projectedRetention: Number((plan.projectedRetention * 100).toFixed(1)),
    score,
  };
};

/** Does this cut have a reason not to be rendered yet? */
export const blockers = (report: QcReport) =>
  report.findings.filter((f) => f.severity === "FATAL");
