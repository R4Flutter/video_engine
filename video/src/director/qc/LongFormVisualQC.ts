// LongFormVisualQC: documentary visual-language QA.
//
// Unlike the Shorts visual gate, this cares about evidence hierarchy,
// repetition, legibility, and meaningful visual-state changes. A long-form
// documentary is allowed to hold a photograph, document, chart, or B-roll
// sequence when the viewer is learning or feeling something from it.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

const MAX_MODULE_SHARE = 0.42;
const HIGH_MODULE_RUN = 3;
const REVIEW_MODULE_RUN = 2;
const MAX_TEXT_CHARS = 54;
const MIN_DISTINCT_MODULES = 5;
const MIN_EVIDENCE_EVENTS = 8;

const semanticModule = (module: string) => /chart|stat|compare|evidence|timeline|icon|footage|document|archive|ui|proof|payoff|coin|mountain|jar|kinetic/i.test(module);

export const runLongFormVisualQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };
  const beats = plan.beats;

  const counts: Record<string, number> = {};
  for (const b of beats) counts[b.visual.module] = (counts[b.visual.module] ?? 0) + 1;
  for (const [module, count] of Object.entries(counts)) {
    if (count / Math.max(1, beats.length) > MAX_MODULE_SHARE) {
      flag({
        at: -1,
        level: "warn",
        severity: "MED",
        rule: "longform-module-dominance",
        message: `"${module}" is ${(count / beats.length * 100).toFixed(0)}% of the visual plan`,
        reason: "long-form needs a recurring visual grammar, not one module repeated until it feels templated.",
        fix: "replace a few repeated treatments with semantically different evidence, comparison, or human-scale footage.",
      }, 0.55);
    }
  }

  let runModule = "";
  let run = 0;
  for (const b of beats) {
    if (b.visual.module === runModule) run += 1;
    else {
      runModule = b.visual.module;
      run = 1;
    }
    if (run === HIGH_MODULE_RUN) {
      flag({
        at: b.start,
        beat: b.n,
        level: "warn",
        severity: "MED",
        rule: "longform-module-run",
        message: `${run} consecutive beats use "${runModule}"`,
        reason: "repetition becomes visible when the frame language does not change across multiple claims.",
        fix: "change the visual treatment only when the new treatment advances the story.",
      }, 0.45);
    }
  }

  const distinct = new Set(beats.map((b) => b.visual.module)).size;
  if (distinct < MIN_DISTINCT_MODULES && beats.length >= 10) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "longform-visual-variety-floor",
      message: `only ${distinct} distinct visual modules across ${beats.length} beats`,
      reason: "long-form variety should come from changing evidence relationships, not decorative motion.",
      fix: "introduce distinct documentary modes: scene, evidence, data, comparison, interface, or reconstruction where appropriate.",
    }, 0.55);
  }

  for (const b of beats) {
    const text = (b.typography.text ?? "").trim();
    if (text.length > MAX_TEXT_CHARS) {
      flag({
        at: b.start,
        beat: b.n,
        level: "info",
        severity: "MED",
        rule: "longform-text-overload",
        message: `beat ${b.n} carries ${text.length} overlay characters`,
        reason: "documentary graphics still need hierarchy; the full argument belongs in narration or evidence, not a paragraph on screen.",
        fix: "reduce the overlay to the one claim or figure the eye needs.",
      }, 0.3);
    }
  }

  const proofBeats = beats.filter((b) => ["proof", "explain", "reveal"].includes(b.narrative.purpose));
  const evidenceEvents = plan.attentionEvents.filter((e) => ["NUMBER_REVEAL", "ANNOTATION_DRAW", "CONTRADICTION", "REVEAL", "PAYOFF"].includes(e.type)).length;
  if (proofBeats.length >= 8 && evidenceEvents < MIN_EVIDENCE_EVENTS) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "thin-evidence-language",
      message: `${evidenceEvents} evidence/reveal events for ${proofBeats.length} proof/explanation beats`,
      reason: "finance stories earn trust when the frame visibly demonstrates the claim instead of simply decorating narration.",
      fix: "stage source snippets, numbers, comparisons, annotations, or concrete footage on genuine proof beats.",
    }, 0.45);
  }

  const nonSemantic = beats.filter((b) => !semanticModule(b.visual.module));
  if (nonSemantic.length / Math.max(1, beats.length) > 0.25) {
    flag({
      at: -1,
      level: "info",
      severity: "LOW",
      rule: "low-semantic-visual-share",
      message: `${nonSemantic.length}/${beats.length} beats use weakly semantic visual modules`,
      reason: "visuals should explain, prove, contrast, or embody the narration wherever possible.",
      fix: "prefer concrete evidence or human-scale action over generic filler footage.",
    }, 0.2);
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
