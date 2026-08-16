// VisualDirector: editorial module, reveal and caption policy.
// Long-form finance uses an evidence-first vocabulary and never falls back to
// decorative coin animations when a semantic module is missing.
import type { CaptionMode, RevealMode, Script, ScriptBeat, VisualPurpose } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import { visualPurposeFor, MODULE_BY_PURPOSE } from "./VisualPurpose.ts";
import { enforceVariety, knownModule } from "./VisualContinuity.ts";
import { LONGFORM_ALLOWED_MODULES, normalizeLongFormModule, isLongForm } from "./LongFormModulePolicy.ts";

export type VisualDecision = { purpose: VisualPurpose; module: string; reveal: RevealMode; captionMode: CaptionMode; holdFrames: number };

export const NATIVE_REVEAL: Record<string, RevealMode> = {
  kinetic:"MASK", doodle:"DRAW_ON", icon:"SEQUENTIAL", chart:"PROGRESSIVE", compare:"SEQUENTIAL", stat:"COUNTER_REVEAL",
  footage:"HIDDEN_THEN_REVEAL", callout:"DRAW_ON", timeline:"PROGRESSIVE", quote:"HIDDEN_THEN_REVEAL", evidence:"HIDDEN_THEN_REVEAL",
  archive:"HIDDEN_THEN_REVEAL", payoff:"COUNTER_REVEAL", outro:"SEQUENTIAL",
};

export const CAPTION_BY_MODULE: Record<string, CaptionMode> = {
  kinetic:"NONE", stat:"EMPHASIS", chart:"EMPHASIS", compare:"EMPHASIS", quote:"EMPHASIS", doodle:"SUBTITLE",
  footage:"SUBTITLE", callout:"SUBTITLE", icon:"SUBTITLE", timeline:"SUBTITLE", evidence:"SUBTITLE", archive:"SUBTITLE",
  payoff:"EMPHASIS", outro:"NONE",
};

export const visualFor = (b: ScriptBeat, facts: BeatFacts, engine: "vox"|"finance", isFirst: boolean, frameZeroHold: number): VisualDecision => {
  const purpose = isFirst ? "CLAIM" : visualPurposeFor(b);
  const longForm = false;
  const explicit = b.module && knownModule(b.module) ? b.module : undefined;
  const fallback = (MODULE_BY_PURPOSE[purpose][engine] ?? [])[0] ?? "evidence";
  const module = explicit ?? fallback;
  const reveal: RevealMode = isFirst ? "IMMEDIATE" : (b.revealMode?.toUpperCase() as RevealMode) || NATIVE_REVEAL[module] || "SEQUENTIAL";
  const captionMode = (b.captionMode?.toUpperCase() as CaptionMode) || CAPTION_BY_MODULE[module] || "SUBTITLE";
  return { purpose, module, reveal, captionMode, holdFrames: isFirst ? frameZeroHold : 0 };
};

export const directVisuals = (script: Script, facts: BeatFacts[], frameZeroHold: number): { decisions: VisualDecision[]; novelty: number[]; warnings: string[] } => {
  const engine: "vox"|"finance" = script.engine === "vox" ? "vox" : "finance";
  const longForm = engine === "finance" && isLongForm(script.durationInSeconds);
  const base = script.beats.map((b, i) => {
    const purpose = i === 0 && !longForm ? "CLAIM" : (i === 0 ? "CLAIM" : visualPurposeFor(b));
    const requested = b.module;
    const hasMedia = Boolean(b.footage || b.source || b.visual || (b as any).asset || (b as any).assetPath);
    const module = longForm
      ? normalizeLongFormModule(requested, purpose, hasMedia)
      : (requested && knownModule(requested) ? requested : (MODULE_BY_PURPOSE[purpose][engine] ?? [])[0] ?? "coinDrop");
    const reveal: RevealMode = longForm && i === 0
      ? "HIDDEN_THEN_REVEAL"
      : i === 0 ? "IMMEDIATE" : (b.revealMode?.toUpperCase() as RevealMode) || NATIVE_REVEAL[module] || "SEQUENTIAL";
    const captionMode = (b.captionMode?.toUpperCase() as CaptionMode) || CAPTION_BY_MODULE[module] || "SUBTITLE";
    return { purpose, module, reveal, captionMode, holdFrames: longForm ? 0 : (i === 0 ? frameZeroHold : 0) } as VisualDecision;
  });

  const staged = script.beats.map((b, i) => ({ ...b, module: base[i].module }));
  const { beats, novelty, warnings } = enforceVariety({ ...script, beats: staged }, (b) => {
    const i = script.beats.findIndex((x) => x.n === b.n); return base[i]?.purpose ?? "EXPLAIN";
  });
  const decisions = beats.map((b, i) => {
    const purpose = base[i].purpose; const module = longForm ? normalizeLongFormModule(b.module, purpose, Boolean(script.beats[i].footage || script.beats[i].source || script.beats[i].visual)) : (b.module ?? base[i].module);
    return {
      ...base[i], module,
      reveal: longForm && i === 0 ? "HIDDEN_THEN_REVEAL" as RevealMode : (script.beats[i].revealMode?.toUpperCase() as RevealMode) || NATIVE_REVEAL[module] || base[i].reveal,
      captionMode: (script.beats[i].captionMode?.toUpperCase() as CaptionMode) || CAPTION_BY_MODULE[module] || base[i].captionMode,
      holdFrames: longForm && i === 0 ? 0 : base[i].holdFrames,
    };
  });

  // Explicitly reject legacy finance-only animation modules in long-form.
  if (longForm) {
    for (const d of decisions) if (!LONGFORM_ALLOWED_MODULES.has(d.module)) warnings.push(`beat ${script.beats[decisions.indexOf(d)].n}: legacy module ${d.module} is not allowed in long-form; normalized to ${d.module}`);
  }
  return { decisions, novelty, warnings };
};
