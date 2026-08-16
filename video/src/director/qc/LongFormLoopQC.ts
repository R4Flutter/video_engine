// LongFormLoopQC: semantic ending/callback QA for long-form documentaries.
//
// A long documentary does not need to literally loop like a Short. The useful
// ending property is closure: the opening question, image, number, or motif is
// revisited in a changed light and the final thesis feels earned.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

const MIN_PAYOFF_DISTANCE = 15;
const FINAL_WINDOW = 45;

export const runLongFormLoopQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  const last = plan.beats[plan.beats.length - 1];
  const payoffBeats = plan.beats.filter((b) => b.narrative.purpose === "payoff" || b.narrative.purpose === "reveal");
  const finalBeats = plan.beats.filter((b) => b.start >= Math.max(0, plan.project.durationInSeconds - FINAL_WINDOW));

  if (!payoffBeats.length) {
    flag({
      at: last?.start ?? -1,
      beat: last?.n,
      level: "warn",
      severity: "HIGH",
      rule: "longform-no-payoff",
      message: "no explicit final reveal/payoff beat exists",
      reason: "the audience needs a concluding idea that changes how the earlier evidence is understood.",
      fix: "mark the genuine thesis/reframe as a payoff beat; do not manufacture a slogan.",
    }, 1.5);
  }

  if (!finalBeats.some((b) => b.narrative.purpose === "payoff" || b.narrative.purpose === "reveal")) {
    flag({
      at: last?.start ?? -1,
      beat: last?.n,
      level: "warn",
      severity: "MED",
      rule: "late-payoff",
      message: "no payoff is staged in the final 45 seconds",
      reason: "the ending should feel like a destination rather than a final paragraph followed by credits.",
      fix: "move the existing final reframe/payoff into the closing sequence without changing narration.",
    }, 0.7);
  }

  if (!plan.loop.closes) {
    flag({
      at: last?.start ?? -1,
      beat: last?.n,
      level: "warn",
      severity: "HIGH",
      rule: "longform-open-motif",
      message: `opening motif "${plan.loop.motif}" is not visibly revisited`,
      reason: "a callback rewards memory and lets the final insight reframe the opening scene.",
      fix: "reintroduce the opening image, number, phrase, or visual motif in the final sequence.",
    }, 1.3);
  }

  const firstStart = plan.beats[0]?.start ?? 0;
  const lastEvent = [...plan.attentionEvents].sort((a, b) => b.at - a.at)[0];
  if (lastEvent && lastEvent.at - firstStart < MIN_PAYOFF_DISTANCE) {
    flag({
      at: lastEvent.at,
      beat: last?.n,
      level: "info",
      severity: "LOW",
      rule: "compressed-ending-check",
      message: "final structural callback is compressed unusually close to the preceding event",
      reason: "the final insight benefits from a clean landing rather than being buried under multiple simultaneous events.",
      fix: "allow a short visual/audio settle before the final frame if the render feels crowded.",
    }, 0.15);
  }

  // Do not require seamless replay for long-form. A clean ending is more
  // important than pretending a 19-minute documentary is a looping Short.
  if (plan.loop.seamless === true && plan.project.durationInSeconds > 120) {
    // No penalty: seamless is optional and may be useful for social reposts.
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
