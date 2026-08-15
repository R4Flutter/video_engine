// CameraPlanner: semantic camera intent, not scale values. The renderer's
// camera table turns intent into framing, so a change of taste happens in one
// place instead of seven.
//
// The Shorts-specific rule: beat one holds. A camera move on the hook frame
// competes with reading it, and reading it is the only thing that matters in
// that half second.
import type { CameraIntent, Emotion, ScriptBeat } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import type { VisualDecision } from "../visual/VisualDirector.ts";

const KNOWN: CameraIntent[] = ["hold", "push", "pull", "punch", "settle"];

const BY_PURPOSE: Record<string, CameraIntent> = {
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
  kinetic: "hold", // flying type plus a moving camera is two edits fighting
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

export const cameraFor = (
  b: ScriptBeat,
  facts: BeatFacts,
  visual: VisualDecision,
  emotion: Emotion,
  isFirst: boolean,
): CameraIntent => {
  if (b.camera) {
    const named = b.camera.toLowerCase();
    const hit = KNOWN.find((k) => named.includes(k));
    if (hit) return hit;
  }
  if (isFirst) return "hold";
  if (facts.purpose === "payoff" || facts.purpose === "reveal") return "punch";
  if (emotion === "tension" || emotion === "surprise") return "push";
  if (emotion === "relief" || emotion === "satisfaction") return "pull";
  return BY_MODULE[visual.module] ?? BY_PURPOSE[facts.purpose] ?? "settle";
};
