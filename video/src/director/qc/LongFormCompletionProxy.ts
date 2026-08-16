// LongFormCompletionProxy: comparative completion QA for documentary cuts.
//
// This is intentionally not a YouTube forecast. It ranks versions of the same
// long-form plan using editorial signals that can be measured before rendering.
import type { ShortPlan } from "../types.ts";
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import { clamp } from "../util.ts";

export const runLongFormCompletionProxy = (
  plan: ShortPlan,
  curiosity: CuriosityState,
  scores: { hook: number; pacing: number; curiosity: number; visualVariety: number; audio: number; loop: number },
): number => {
  if (plan.project.durationInSeconds < 120) return plan.projectedRetention;

  const durationMin = Math.max(1, plan.project.durationInSeconds / 60);
  const sequenceCount = new Set(plan.sequences.map((s) => s.id)).size;
  const chapterFactor = clamp(sequenceCount / 8, 0.55, 1);
  const meaningful = plan.attentionEvents.filter((e) => !["SILENCE"].includes(e.type));
  const eventDensity = meaningful.length / durationMin;
  const eventFactor = clamp(eventDensity / 1.25, 0.55, 1);
  const resolvedQuestions = curiosity.closed.length / Math.max(1, curiosity.opened.length);
  const resolutionFactor = clamp(resolvedQuestions, 0.45, 1);
  const earlyEvents = meaningful.filter((e) => e.at <= 30).length;
  const introFactor = clamp(earlyEvents / 4, 0.55, 1);

  const craft01 = clamp(
    (scores.hook * 0.24 + scores.pacing * 0.24 + scores.curiosity * 0.22 + scores.visualVariety * 0.12 + scores.audio * 0.08 + scores.loop * 0.10) / 10,
    0,
    1,
  );

  const proxy = craft01 * 0.58 + introFactor * 0.10 + chapterFactor * 0.12 + eventFactor * 0.10 + resolutionFactor * 0.10;
  return Number(clamp(proxy, 0, 0.9).toFixed(4));
};
