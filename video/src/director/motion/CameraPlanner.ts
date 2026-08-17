// CameraPlanner: semantic camera intent, not raw scale values.
//
// The renderer owns the exact magnitude of each move. This planner decides
// WHY the camera moves. Long-form needs a calmer, more cinematic language than
// Shorts: movement follows narrative verbs and the same intent is not spammed
// across consecutive beats.
import type { CameraIntent, Emotion, ScriptBeat } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import type { VisualDecision } from "../visual/VisualDirector.ts";

const KNOWN: CameraIntent[] = ["hold", "push", "pull", "punch", "settle"];

const BY_PURPOSE_SHORT: Record<string, CameraIntent> = {
  hook: "hold",
  turn: "punch",
  explain: "settle",
  proof: "push",
  escalate: "push",
  reveal: "punch",
  payoff: "punch",
  cta: "pull",
};

const BY_MODULE: Record<string, CameraIntent> = {
  kinetic: "hold",
  stat: "push",
  compare: "settle",
  chart: "settle",
  timeline: "settle",
  icon: "settle",
  doodle: "push",
  footage: "push",
  callout: "push",
  quote: "hold",
  coinDrop: "push",
  coinStack: "settle",
  investChart: "settle",
  jarFill: "push",
  mountain: "pull",
  payoff: "punch",
  outro: "pull",
};

// Long-form camera grammar for the 19:14 documentary. These are deliberately
// varied so the film breathes: establishing holds, investigative pushes,
// evidence settles, consequence pulls, and only a few hard-impact punches.
const LONGFORM_BY_PURPOSE: Record<string, CameraIntent> = {
  hook: "hold",
  turn: "push",
  explain: "settle",
  proof: "push",
  escalate: "push",
  reveal: "settle",
  payoff: "pull",
  cta: "hold",
};

// Specific story beats get a hand-directed lens move. The beat numbers are
// stable in script_beats.md for the Company Sells Nothing episode.
const LONGFORM_BEATS: Record<number, CameraIntent> = {
  1: "hold",
  2: "push",
  3: "settle",
  4: "push",
  5: "pull",
  6: "settle",
  7: "push",
  8: "hold",
  9: "push",
  10: "settle",
  11: "push",
  12: "punch",
  13: "settle",
  14: "push",
  15: "pull",
  16: "hold",
  17: "push",
  18: "punch",
  19: "push",
  20: "settle",
  21: "pull",
  22: "settle",
  23: "push",
  24: "pull",
  25: "punch",
  26: "settle",
  27: "push",
  28: "hold",
  29: "punch",
  30: "settle",
  31: "pull",
  32: "punch",
  33: "hold",
  34: "pull",
  35: "hold",
  36: "settle",
  37: "push",
  38: "settle",
  39: "push",
  40: "hold",
};

const isLongForm = (b: ScriptBeat): boolean =>
  b.end - b.start >= 600 || Boolean((b as ScriptBeat & { longform?: boolean }).longform);

export const cameraFor = (
  b: ScriptBeat,
  facts: BeatFacts,
  visual: VisualDecision,
  emotion: Emotion,
  isFirst: boolean,
  previous?: CameraIntent,
): CameraIntent => {
  if (b.camera) {
    const named = b.camera.toLowerCase();
    const hit = KNOWN.find((k) => named.includes(k));
    if (hit) return hit;
  }

  if (isLongForm(b)) {
    if (isFirst) return "hold";
    const authored = LONGFORM_BEATS[b.n];
    const base = authored ?? LONGFORM_BY_PURPOSE[facts.purpose] ?? "settle";

    // Avoid accidental rhythm spam. Two identical moves in a row are only
    // allowed for holds; otherwise rotate to a compatible quieter move.
    if (previous === base && base !== "hold") {
      if (base === "push") return emotion === "relief" ? "pull" : "settle";
      if (base === "pull") return "settle";
      if (base === "settle") return emotion === "tension" ? "push" : "hold";
      if (base === "punch") return "settle";
    }
    return base;
  }

  // Legacy Short behavior stays intact for actual short-form episodes.
  if (isFirst) return "hold";
  if (facts.purpose === "payoff" || facts.purpose === "reveal") return "punch";
  if (emotion === "tension" || emotion === "surprise") return "push";
  if (emotion === "relief" || emotion === "satisfaction") return "pull";
  return BY_MODULE[visual.module] ?? BY_PURPOSE_SHORT[facts.purpose] ?? "settle";
};