// VisualDirector: module, reveal mode and caption mode per beat.
//
// The one rule that separates this from the essay version: beat one reveals
// IMMEDIATE. Whatever clever staging a module normally does, the first beat
// shows its complete claim on frame one. Everything else follows the module's
// native behaviour.
import type { CaptionMode, RevealMode, Script, ScriptBeat, VisualPurpose } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import { visualPurposeFor, MODULE_BY_PURPOSE } from "./VisualPurpose.ts";
import { enforceVariety, knownModule } from "./VisualContinuity.ts";

export type VisualDecision = {
  purpose: VisualPurpose;
  module: string;
  reveal: RevealMode;
  captionMode: CaptionMode;
  holdFrames: number;
};

/** The reveal each module is built to do. */
export const NATIVE_REVEAL: Record<string, RevealMode> = {
  kinetic: "MASK",
  doodle: "DRAW_ON",
  icon: "SEQUENTIAL",
  chart: "PROGRESSIVE",
  compare: "SEQUENTIAL",
  stat: "COUNTER_REVEAL",
  footage: "HIDDEN_THEN_REVEAL",
  callout: "DRAW_ON",
  timeline: "PROGRESSIVE",
  quote: "HIDDEN_THEN_REVEAL",
  coinDrop: "SEQUENTIAL",
  coinStack: "SEQUENTIAL",
  investChart: "PROGRESSIVE",
  jarFill: "PROGRESSIVE",
  mountain: "PROGRESSIVE",
  payoff: "COUNTER_REVEAL",
  outro: "SEQUENTIAL",
};

/** Caption policy per module: never burn the full narration over a frame
 *  that already says it. Doubling the words halves the reading of both. */
export const CAPTION_BY_MODULE: Record<string, CaptionMode> = {
  kinetic: "NONE", // the words ARE the frame
  stat: "EMPHASIS",
  chart: "EMPHASIS",
  compare: "EMPHASIS",
  quote: "EMPHASIS",
  doodle: "SUBTITLE",
  footage: "SUBTITLE",
  callout: "SUBTITLE",
  icon: "SUBTITLE",
  timeline: "SUBTITLE",
  coinDrop: "SUBTITLE",
  coinStack: "SUBTITLE",
  investChart: "SUBTITLE",
  jarFill: "SUBTITLE",
  mountain: "SUBTITLE",
  payoff: "EMPHASIS",
  outro: "NONE",
};

export const visualFor = (
  b: ScriptBeat,
  facts: BeatFacts,
  engine: "vox" | "finance",
  isFirst: boolean,
  frameZeroHold: number,
): VisualDecision => {
  const purpose = isFirst ? "CLAIM" : visualPurposeFor(b);

  // The parser already resolved a module; trust it when it is real, else pick
  // from the purpose table for this engine.
  const module =
    b.module && knownModule(b.module)
      ? b.module
      : (MODULE_BY_PURPOSE[purpose][engine] ?? [])[0] ?? (engine === "vox" ? "kinetic" : "coinDrop");

  // Beat one is never staged progressively. This is the whole point of the
  // rebuild: the complete claim exists on frame one or the video is judged on
  // an empty frame.
  const reveal: RevealMode = isFirst
    ? "IMMEDIATE"
    : (b.revealMode?.toUpperCase() as RevealMode) || NATIVE_REVEAL[module] || "SEQUENTIAL";

  const captionMode =
    (b.captionMode?.toUpperCase() as CaptionMode) || CAPTION_BY_MODULE[module] || "SUBTITLE";

  return {
    purpose,
    module,
    reveal,
    captionMode,
    holdFrames: isFirst ? frameZeroHold : 0,
  };
};

export const directVisuals = (
  script: Script,
  facts: BeatFacts[],
  frameZeroHold: number,
): { decisions: VisualDecision[]; novelty: number[]; warnings: string[] } => {
  const engine: "vox" | "finance" = script.engine === "vox" ? "vox" : "finance";
  const base = script.beats.map((b, i) => visualFor(b, facts[i], engine, i === 0, frameZeroHold));
  const staged = script.beats.map((b, i) => ({ ...b, module: base[i].module }));

  const { beats, novelty, warnings } = enforceVariety({ ...script, beats: staged }, (b) => {
    const i = script.beats.findIndex((x) => x.n === b.n);
    return base[i]?.purpose ?? "EXPLAIN";
  });

  const decisions = beats.map((b, i) => {
    const module = b.module ?? base[i].module;
    return {
      ...base[i],
      module,
      // A restaged beat inherits the new module's native behaviour, unless
      // the author pinned one or it is beat one.
      reveal:
        i === 0
          ? ("IMMEDIATE" as RevealMode)
          : (script.beats[i].revealMode?.toUpperCase() as RevealMode) ||
            NATIVE_REVEAL[module] ||
            base[i].reveal,
      captionMode:
        (script.beats[i].captionMode?.toUpperCase() as CaptionMode) ||
        CAPTION_BY_MODULE[module] ||
        base[i].captionMode,
    };
  });

  return { decisions, novelty, warnings };
};
