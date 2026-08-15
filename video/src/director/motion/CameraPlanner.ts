// CameraPlanner: semantic camera intent, not pixel values.
// The renderer decides the exact transform; this layer decides why the camera
// should move.
import type { CameraIntent, Emotion, ScriptBeat } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import type { VisualDecision } from "../visual/VisualDirector.ts";

const KNOWN: CameraIntent[] = ["hold", "push", "pull", "punch", "settle"];

const ALIASES: Array<[string, CameraIntent]> = [
  ["dolly in", "push"],
  ["push in", "push"],
  ["zoom in", "push"],
  ["move in", "push"],
  ["dolly out", "pull"],
  ["pull out", "pull"],
  ["zoom out", "pull"],
  ["track", "settle"],
  ["pan", "settle"],
  ["drift", "settle"],
  ["whip", "punch"],
  ["slam", "punch"],
];

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

const intentFromText = (value: string): CameraIntent | undefined => {
  const named = value.toLowerCase().trim();
  const direct = KNOWN.find((k) => named === k || named.includes(k));
  if (direct) return direct;
  for (const [alias, intent] of ALIASES) if (named.includes(alias)) return intent;
  return undefined;
};

export const cameraFor = (
  b: ScriptBeat,
  facts: BeatFacts,
  visual: VisualDecision,
  emotion: Emotion,
  isFirst: boolean,
): CameraIntent => {
  if (b.camera) {
    const explicit = intentFromText(b.camera);
    if (explicit) return explicit;
  }
  if (isFirst) return "hold";
  if (facts.purpose === "payoff" || facts.purpose === "reveal") return "punch";
  if (emotion === "tension" || emotion === "surprise") return "push";
  if (emotion === "relief" || emotion === "satisfaction") return "pull";
  return BY_MODULE[visual.module] ?? BY_PURPOSE[facts.purpose] ?? "settle";
};
