// AttentionDirector: the per-beat attention profile. Novelty, curiosity,
// tension, information density and emotional intensity, plus the strategy the
// beat uses to earn the next second.
//
// The essay version treats these as planning signals for a viewer who has
// already committed. Here they feed the swipe model directly, so the numbers
// have to mean something specific: `informationDensity` is "how much of this
// beat is new to the viewer", not "how busy it looks".
import type { AttentionStrategy, Emotion, ScriptBeat } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import type { RhythmDecision } from "./RhythmEngine.ts";
import { clamp, round2, words } from "../util.ts";

export type AttentionProfile = {
  novelty: number;
  curiosity: number;
  tension: number;
  informationDensity: number;
  emotionalIntensity: number;
  strategy: AttentionStrategy;
};

const HIGH_TENSION = new Set<Emotion>(["tension", "indignation", "surprise"]);

export const profileFor = (
  b: ScriptBeat,
  facts: BeatFacts,
  emotion: Emotion,
  rhythm: RhythmDecision,
  isFirst: boolean,
): AttentionProfile => {
  const dur = Math.max(0.2, b.end - b.start);

  // Curiosity is earned by open questions and by reveals that are coming but
  // haven't landed. It is the single strongest anti-swipe force in the model.
  const curiosity = clamp(
    0.45 +
      (facts.question ? 0.32 : 0) +
      (facts.reveal ? 0.18 : 0) +
      (emotion === "curiosity" || emotion === "surprise" ? 0.12 : 0),
    0.1,
    1,
  );

  const tension = HIGH_TENSION.has(emotion) ? 0.78 : facts.purpose === "escalate" ? 0.7 : 0.35;

  // Density counts *new* things: a number the viewer hasn't seen, an
  // on-screen claim, a mechanism being named. Restating is not information.
  const density = clamp(
    0.2 +
      facts.numbers.length * 0.13 +
      (b.text?.trim() ? 0.18 : 0) +
      (facts.purpose === "explain" || facts.purpose === "proof" ? 0.22 : 0) +
      (words(b.vo).length > 22 ? 0.12 : 0) -
      (facts.purpose === "cta" ? 0.25 : 0),
    0.05,
    1,
  );

  const emotionalIntensity =
    emotion === "indignation" || emotion === "surprise"
      ? 0.85
      : emotion === "tension" || emotion === "recognition"
        ? 0.72
        : emotion === "satisfaction" || emotion === "relief"
          ? 0.6
          : 0.35;

  // Strategy. Beat one is always frame_zero — nothing else may be attempted
  // there, because everything else costs comprehension the video cannot pay.
  const strategy: AttentionStrategy = isFirst
    ? "frame_zero"
    : facts.purpose === "payoff"
      ? "impact"
      : facts.purpose === "reveal"
        ? "resolve"
        : facts.question
          ? "open_loop"
          : dur >= 4 || rhythm.tier === "OVERLONG"
            ? "progressive"
            : "impact";

  return {
    // Novelty is set by VisualContinuity once module runs are known; this is
    // the neutral prior.
    novelty: 0.6,
    curiosity: round2(curiosity),
    tension: round2(tension),
    informationDensity: round2(density),
    emotionalIntensity: round2(emotionalIntensity),
    strategy,
  };
};
