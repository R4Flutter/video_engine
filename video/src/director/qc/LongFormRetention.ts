// LongFormRetention: internal comparative retention proxy for documentary cuts.
// It is deliberately not a YouTube forecast. It compares versions of the same
// long-form edit using signals that make sense for long videos.
import type { ShortPlan } from "../types.ts";
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import { clamp } from "../util.ts";

export const runLongFormRetentionProxy = (
  plan: ShortPlan,
  curiosity: CuriosityState,
  componentScores: {
    hook: number;
    pacing: number;
    curiosity: number;
    visualVariety: number;
    audio: number;
    loop: number;
  },
): number => {
  const duration = plan.project.durationInSeconds;
  if (duration < 120) return plan.projectedRetention;

  const chapterCount = new Set(plan.beats.map((b) => b.sequenceId)).size;
  const chapterFactor = clamp(chapterCount / 8, 0.5, 1.0);
  const openLoopFactor = curiosity.openLoop.filter(Boolean).length / Math.max(1, curiosity.openLoop.length);
  const meaningfulEvents = plan.attentionEvents.filter((e) => e.type !== "SILENCE").length;
  const eventsPerMinute = meaningfulEvents / Math.max(1, duration / 60);
  const eventFactor = clamp(eventsPerMinute / 1.25, 0.55, 1.0);

  const craft =
    componentScores.hook * 0.22 +
    componentScores.pacing * 0.24 +
    componentScores.curiosity * 0.22 +
    componentScores.visualVariety * 0.12 +
    componentScores.audio * 0.08 +
    componentScores.loop * 0.12;

  const craft01 = clamp(craft / 10, 0, 1);
  const proxy =
    craft01 * 0.60 +
    openLoopFactor * 0.12 +
    chapterFactor * 0.14 +
    eventFactor * 0.14;

  // A completion proxy is intentionally conservative for long-form: it is a
  // comparative QA signal, not a promise that a given percentage of viewers
  // will finish a video.
  return Number(clamp(proxy, 0, 0.9).toFixed(4));
};
