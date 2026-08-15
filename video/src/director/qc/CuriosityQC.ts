// CuriosityQC: is anything ever pending?
//
// The single most reliable predictor of a viewer staying is that they are
// waiting for something. This checks that the video is never in a state where
// nothing is unresolved — and that what it opened, it closes.
import type { QcFinding, ShortPlan } from "../types.ts";
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import { clamp } from "../util.ts";

export const runCuriosityQC = (
  plan: ShortPlan,
  curiosity: CuriosityState,
): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding) => {
    findings.push(f);
    score -= f.level === "warn" ? 1.3 : 0.4;
  };

  // 1. A stretch with nothing pending is where a viewer decides they've got
  //    the point. The CTA is exempt — by then they should have got the point.
  const flat = curiosity.longestFlatRun;
  if (flat && flat.seconds >= 5) {
    flag({
      at: plan.beats.find((b) => b.n === flat.from)?.start ?? -1,
      beat: flat.from,
      level: "warn",
      severity: "HIGH",
      rule: "no-open-loop",
      message: `beats ${flat.from}–${flat.to} (${flat.seconds.toFixed(1)}s) with nothing unresolved`,
      reason: "a viewer with nothing pending has no reason to give the video another second.",
      fix: "add a `Question:` row to the first of those beats, and answer it two beats later.",
    });
  }

  // 2. Questions with no answers.
  if (curiosity.unresolved.length) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "unanswered-question",
      message: `"${curiosity.unresolved[0].question.slice(0, 60)}" is never answered`,
      reason: "an unanswered promise is the reason a comment section argues instead of agreeing.",
      fix: "add a `Reveal:` row on the beat that answers it, or drop the question.",
    });
  }

  // 3. Reveal density. A Short wants a turn roughly every 6–8 seconds.
  const reveals = plan.beats.filter((b) => b.narrative.reveal).length;
  const wanted = Math.max(1, Math.floor(plan.project.durationInSeconds / 8));
  if (reveals < wanted) {
    flag({
      at: -1,
      level: reveals === 0 ? "warn" : "info",
      severity: reveals === 0 ? "HIGH" : "MED",
      rule: "sparse-reveals",
      message: `${reveals} reveal${reveals === 1 ? "" : "s"} in ${Math.round(plan.project.durationInSeconds)}s (want ~${wanted})`,
      reason: "each reveal resets attention. between them, the viewer is spending goodwill.",
      fix: "add `Reveal:` rows naming what the viewer learns on each turn.",
    });
  }

  // 4. Emotional flatness across sequences.
  const registers = new Set(plan.sequences.map((s) => s.emotion));
  if (registers.size <= 1 && plan.beats.length >= 5) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "flat-emotion",
      message: `the whole cut sits in one register (${[...registers][0]})`,
      reason: "flat is indistinguishable from finished, which is why the viewer leaves.",
      fix: "pin `Emotion:` rows — recognition early, tension in the middle, satisfaction at the payoff.",
    });
  }

  // 5. The arc must end on a payoff before it asks for anything.
  const purposes = plan.beats.map((b) => b.narrative.purpose);
  const ctaIndex = purposes.indexOf("cta");
  const payoffIndex = purposes.indexOf("payoff");
  if (payoffIndex < 0) {
    flag({
      at: -1,
      level: "warn",
      severity: "HIGH",
      rule: "no-payoff",
      message: "no beat pays the video off",
      reason: "without a payoff there is nothing to have stayed for, and nothing worth sharing.",
      fix: "mark the beat where the arithmetic lands as `Purpose: payoff`.",
    });
  } else if (ctaIndex >= 0 && ctaIndex < payoffIndex) {
    flag({
      at: plan.beats[ctaIndex].start,
      beat: plan.beats[ctaIndex].n,
      level: "warn",
      severity: "HIGH",
      rule: "cta-before-payoff",
      message: "the ask comes before the payoff",
      reason: "asking before delivering is the fastest way to lose the half of the audience still deciding.",
      fix: "move the CTA to the final beat.",
    });
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
