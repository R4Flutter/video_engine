// ShotPlanner: chooses what the viewer should SEE before choosing how it moves.
//
// This is the main bridge from viral intelligence to documentary-grade editing.
// It is deliberately deterministic and CPU-cheap: regex/features, no vision model,
// no frame-by-frame AI. A future vision model can override the result without
// changing the renderer contract.
import type { ScriptBeat, VisualPurpose } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import type { VisualDecision } from "./VisualDirector.ts";

export type AssetKind =
  | "footage"
  | "archival_photo"
  | "document"
  | "chart"
  | "compare"
  | "editorial_graphic"
  | "typography";

export type ShotSize = "wide" | "medium" | "close" | "detail";
export type Composition = "center" | "left_focus" | "right_focus" | "split" | "full_bleed";
export type ShotEntry = "cut" | "push_in" | "wipe" | "rise" | "fade";
export type ShotExit = "cut" | "hold" | "push_out" | "settle";

export type ShotDecision = {
  asset: AssetKind;
  shot: ShotSize;
  composition: Composition;
  entry: ShotEntry;
  exit: ShotExit;
  cameraBias: "still" | "breathing" | "active" | "impact";
  visualJob: string;
  reason: string;
  cpuCost: "low" | "medium";
  maxCaptionWords: number;
};

const HAS_NUMBER = /[$₹€£]?\s?\d[\d,.]*\s?%?|\b\d{2,4}\b/;
const HAS_ENTITY = /\b(apple|amazon|tesla|kodak|google|meta|microsoft|sony|canon|fuji|bank|company|ceo|founder|investor)\b/i;
const HAS_EVIDENCE = /\b(according|report|filing|receipt|statement|document|source|lawsuit|court|email|memo|screenshot|annual report|10-k|10q)\b/i;
const HAS_MECHANISM = /\b(because|how|works|mechanism|process|engine|model|system|every time|each month|per share|margin|revenue|profit)\b/i;
const HAS_COMPARISON = /\b(vs\.?|versus|while|than|more than|less than|compared|difference|gap|both)\b/i;

const defaultAsset = (purpose: VisualPurpose, b: ScriptBeat): AssetKind => {
  const t = `${b.vo} ${b.visual} ${b.text ?? ""}`;
  if (HAS_EVIDENCE.test(t) || purpose === "PROVE") return "document";
  if (purpose === "COMPARE" || HAS_COMPARISON.test(t)) return "compare";
  if (b.data?.length && (purpose === "INTENSIFY" || purpose === "COMPARE")) return "chart";
  if (HAS_ENTITY.test(t) || b.footage) return "archival_photo";
  if (HAS_MECHANISM.test(t)) return "editorial_graphic";
  if (HAS_NUMBER.test(t)) return "typography";
  return "editorial_graphic";
};

const shotFor = (asset: AssetKind, purpose: VisualPurpose, index: number): ShotSize => {
  if (index === 0) return "close";
  if (asset === "document" || asset === "archival_photo") return purpose === "REVEAL" ? "detail" : "medium";
  if (asset === "footage") return purpose === "EXPLAIN" ? "wide" : "medium";
  if (asset === "typography") return purpose === "INTENSIFY" || purpose === "REVEAL" ? "close" : "medium";
  return "medium";
};

const compositionFor = (asset: AssetKind, purpose: VisualPurpose, index: number): Composition => {
  if (purpose === "COMPARE" || asset === "compare") return "split";
  if (asset === "archival_photo" || asset === "footage") return index % 2 ? "right_focus" : "left_focus";
  if (purpose === "REVEAL" || purpose === "INTENSIFY") return "center";
  return "left_focus";
};

export const shotForBeat = (
  b: ScriptBeat,
  facts: BeatFacts,
  visual: VisualDecision,
  index: number,
): ShotDecision => {
  const t = `${b.vo} ${b.visual} ${b.text ?? ""}`;
  const asset = defaultAsset(visual.purpose, b);
  const shot = shotFor(asset, visual.purpose, index);
  const composition = compositionFor(asset, visual.purpose, index);
  const impact = visual.purpose === "REVEAL" || visual.purpose === "INTENSIFY" || facts.purpose === "payoff";
  const entry: ShotEntry = index === 0 ? "cut" : impact ? "push_in" : asset === "document" ? "wipe" : "rise";
  const exit: ShotExit = impact ? "hold" : visual.purpose === "CLOSE" ? "settle" : "cut";
  const cameraBias = index === 0 ? "still" : impact ? "impact" : facts.purpose === "explain" ? "breathing" : "active";

  let visualJob = "support the spoken idea with a legible visual proof";
  if (asset === "document") visualJob = "show an artifact the viewer can believe";
  else if (asset === "archival_photo") visualJob = "put the real person/company/object on screen";
  else if (asset === "compare") visualJob = "make the contrast visible before the voice explains it";
  else if (asset === "chart") visualJob = "turn the number into a visible relationship";
  else if (asset === "typography") visualJob = "make the claim itself the visual event";
  else if (asset === "editorial_graphic") visualJob = "simplify the mechanism into one visual argument";

  const reason = `${facts.purpose}: ${visual.purpose}; ${asset}; ${shot}; ${composition}`;
  return {
    asset,
    shot,
    composition,
    entry,
    exit,
    cameraBias,
    visualJob,
    reason,
    cpuCost: asset === "footage" || asset === "archival_photo" ? "medium" : "low",
    maxCaptionWords: purposeWords(visual.purpose, t),
  };
};

const purposeWords = (purpose: VisualPurpose, text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (purpose === "CLAIM" || purpose === "REVEAL") return Math.min(words, 6);
  if (purpose === "COMPARE" || purpose === "PROVE") return Math.min(words, 10);
  return Math.min(words, 14);
};
