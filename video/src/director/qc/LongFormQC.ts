// LongFormQC: production-grade QA for long-form documentary edits.
//
// This is NOT a softened Shorts checker. It evaluates the things that matter
// to a 10–30 minute finance/business documentary:
//   - first-30s promise + claim alignment
//   - chapter-level narrative progression
//   - open-loop continuity and closure
//   - reveal / evidence cadence
//   - long-hold justification
//   - repeated visual language
//   - proof visibility
//   - ending payoff + callback
//
// Scores are comparative editorial QA, not a YouTube forecast. Real audience
// retention remains the post-publish ground truth.
import type { CuriosityState } from "../attention/CuriosityEngine.ts";
import type { QcFinding, QcReport, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";
import { runVisualQC } from "./VisualQC.ts";
import { runAudioQC } from "./AudioQC.ts";
import { runLongFormPacingQC } from "./LongFormPacingQC.ts";
import { runLongFormRetentionProxy } from "./LongFormRetention.ts";

const WARN = 1.15;
const INFO = 0.35;

const LONGFORM_WEIGHTS = {
  hook: 0.22,
  pacing: 0.24,
  curiosity: 0.20,
  visualVariety: 0.12,
  audio: 0.08,
  loop: 0.14,
};

const meaningfulTypes = new Set([
  "TEXT_CHANGE",
  "NUMBER_REVEAL",
  "OBJECT_ENTRY",
  "CAMERA_PUNCH",
  "ANNOTATION_DRAW",
  "QUESTION",
  "REVEAL",
  "CONTRADICTION",
  "PAYOFF",
  "PATTERN_INTERRUPT",
  "SFX_ACCENT",
]);

const beatEvents = (plan: ShortPlan, beat: number) =>
  plan.attentionEvents.filter((e) => e.beat === beat && meaningfulTypes.has(e.type));

const first30 = (plan: ShortPlan) =>
  plan.attentionEvents
    .filter((e) => e.at <= Math.min(30, plan.project.durationInSeconds))
    .filter((e) => meaningfulTypes.has(e.type));

const modulesRun = (plan: ShortPlan) => {
  const runs: { module: string; beats: number[] }[] = [];
  for (const b of plan.beats) {
    const last = runs[runs.length - 1];
    if (last?.module === b.visual.module) last.beats.push(b.n);
    else runs.push({ module: b.visual.module, beats: [b.n] });
  }
  return runs;
};

const sequenceCount = (plan: ShortPlan) =>
  new Set(plan.beats.map((b) => b.sequenceId).filter(Boolean)).size;

const longestNoEventGap = (plan: ShortPlan) => {
  const events = [...plan.attentionEvents]
    .filter((e) => meaningfulTypes.has(e.type))
    .sort((a, b) => a.at - b.at);
  let previous = 0;
  let largest = { start: 0, end: 0, seconds: 0 };
  for (const e of events) {
    const gap = e.at - previous;
    if (gap > largest.seconds) largest = { start: previous, end: e.at, seconds: gap };
    previous = e.at;
  }
  const tail = plan.project.durationInSeconds - previous;
  if (tail > largest.seconds) largest = { start: previous, end: plan.project.durationInSeconds, seconds: tail };
  return largest;
};

const clampScore = (v: number) => Number(clamp(v, 0, 10).toFixed(1));

const scoreHook = (plan: ShortPlan, firstVo: string, findings: QcFinding[]) => {
  let score = 10;
  const fz = plan.frameZero;
  const introEvents = first30(plan);

  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  // First-frame discipline remains strict, but uses long-form expectations.
  if (!fz.text.trim()) {
    flag({
      at: 0,
      level: "warn",
      severity: "FATAL",
      rule: "longform-blank-frame-zero",
      message: "frame zero has no designed on-screen claim",
      reason: "the title/thumbnail promise needs immediate visual confirmation.",
      fix: "write one evidence-led hook line for frame zero.",
    }, 4);
  } else {
    if (!fz.glanceable) {
      flag({
        at: 0,
        level: "warn",
        severity: "HIGH",
        rule: "longform-hook-too-dense",
        message: `frame-zero hook is ${fz.words} words / ${fz.chars} chars`,
        reason: "long-form viewers still need to decode the opening instantly before the documentary rhythm takes over.",
        fix: "reduce the frame-zero claim to a short evidence phrase.",
      }, WARN);
    }
    if (fz.holdFrames < 8) {
      flag({
        at: 0,
        level: "info",
        severity: "LOW",
        rule: "longform-hook-underheld",
        message: `frame-zero claim held for ${(fz.holdFrames / plan.project.fps).toFixed(2)}s`,
        reason: "the first claim should be fully legible before the first visual state change.",
        fix: "hold long enough for a calm read; no need to animate the text in.",
      }, INFO);
    }
    if (!fz.audioSynced) {
      flag({
        at: 0,
        level: "warn",
        severity: "HIGH",
        rule: "hook-desync",
        message: "frame-zero text and first spoken claim are competing messages",
        reason: "the opening is strongest when the visual evidence and opening narration reinforce one idea.",
        fix: "make frame-zero text a word-for-word subset of the opening narration.",
      }, WARN);
    }
  }

  // Long-form should make the contradiction explicit early, but it need not
  // finish the whole thesis immediately.
  if (fz.timeToClaim > 8) {
    flag({
      at: 0,
      level: "warn",
      severity: "HIGH",
      rule: "late-claim",
      message: `opening claim is not legible until ${fz.timeToClaim.toFixed(1)}s`,
      reason: "YouTube's long-form intro is explicitly evaluated at 30 seconds; the opening still needs to establish the promised problem before then.",
      fix: "surface the core contradiction in the first sequence; leave explanation for beat 2+.",
    }, WARN);
  } else if (fz.timeToClaim > 4) {
    flag({
      at: 0,
      level: "info",
      severity: "LOW",
      rule: "claim-lands-slowly",
      message: `core claim becomes complete at ${fz.timeToClaim.toFixed(1)}s`,
      reason: "acceptable for documentary setup, but earlier clarity usually buys a stronger first-30s hold.",
      fix: "no change if the contradiction is already visually legible.",
    }, INFO);
  }

  const earlyVisualEvents = introEvents.length;
  if (earlyVisualEvents < 2) {
    flag({
      at: 0,
      level: "warn",
      severity: "HIGH",
      rule: "weak-intro-progression",
      message: `only ${earlyVisualEvents} meaningful events in the first 30s`,
      reason: "the intro should establish a promise, contradiction, and forward question—not just state a topic.",
      fix: "stage the key number/evidence reveal and the first open question before 30s.",
    }, WARN);
  }

  if (!firstVo.trim()) {
    flag({
      at: 0,
      level: "warn",
      severity: "HIGH",
      rule: "missing-opening-vo",
      message: "first spoken take is empty",
      reason: "hook/audio alignment cannot be verified without the opening narration.",
      fix: "provide the opening voice take before directing the final edit.",
    }, WARN);
  }

  return clampScore(score);
};

const scoreCuriosity = (plan: ShortPlan, curiosity: CuriosityState, findings: QcFinding[]) => {
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  // Long-form does not need a reveal every 8 seconds. It needs an unresolved
  // question to survive each chapter turn and a payoff that closes it.
  const unresolved = curiosity.unresolved.length;
  if (unresolved) {
    flag({
      at: -1,
      level: "warn",
      severity: "HIGH",
      rule: "unanswered-question",
      message: `the plan ends with ${unresolved} unresolved question${unresolved === 1 ? "" : "s"}`,
      reason: "open loops are useful during the film, but dead promises at the end damage satisfaction.",
      fix: "close the question with a reveal or explicitly replace it with the next question.",
    }, WARN);
  }

  const flat = curiosity.longestFlatRun;
  if (flat && flat.seconds >= 18) {
    flag({
      at: plan.beats.find((b) => b.n === flat.from)?.start ?? -1,
      beat: flat.from,
      level: "warn",
      severity: "HIGH",
      rule: "longform-flat-curiosity",
      message: `beats ${flat.from}–${flat.to} run ${flat.seconds.toFixed(1)}s without an active open loop`,
      reason: "long-form can explain for a while, but the viewer still needs a question, consequence, or unresolved tension pulling them forward.",
      fix: "open a concrete next question before the explanatory block goes flat.",
    }, WARN);
  } else if (flat && flat.seconds >= 12) {
    flag({
      at: plan.beats.find((b) => b.n === flat.from)?.start ?? -1,
      beat: flat.from,
      level: "info",
      severity: "LOW",
      rule: "longform-curiosity-review",
      message: `${flat.seconds.toFixed(1)}s without an active open loop`,
      reason: "review the section for a natural question or consequence reset.",
      fix: "only add a question if it genuinely advances the argument.",
    }, INFO);
  }

  const payoffBeats = plan.beats.filter((b) => b.narrative.purpose === "payoff");
  if (!payoffBeats.length) {
    flag({
      at: -1,
      level: "warn",
      severity: "HIGH",
      rule: "no-payoff",
      message: "no explicit payoff beat exists",
      reason: "a long-form essay needs a final interpretive landing, not just the end of the last example.",
      fix: "mark the beat where the core idea is reinterpreted as `Purpose: payoff`.",
    }, WARN);
  }

  return clampScore(score);
};

const scoreLoop = (plan: ShortPlan, findings: QcFinding[]) => {
  let score = 10;
  const loop = plan.loop;
  const last = plan.beats.at(-1);
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  // A documentary does not need a literal seamless replay loop, but it does
  // need a semantic callback: the opening question should be answered in the
  // final chapter.
  if (!loop.closes) {
    flag({
      at: last?.start ?? -1,
      beat: last?.n,
      level: "warn",
      severity: "HIGH",
      rule: "open-loop-ending",
      message: `the ending does not clearly close the opening motif "${loop.motif}"`,
      reason: "the final minutes should reinterpret the opening promise, not merely stop after the last example.",
      fix: "bring the opening number/image/question back in the final beat, now explained by the full story.",
    }, WARN);
  }

  if (!loop.seamless) {
    // Semantic loop is more important than literal replay for long-form; this
    // is therefore informational rather than a penalty.
    flag({
      at: last?.start ?? -1,
      beat: last?.n,
      level: "info",
      severity: "LOW",
      rule: "nonseamless-documentary-ending",
      message: "final frame is not a literal seamless loop",
      reason: "literal playback looping is optional for long-form; semantic closure is what matters.",
      fix: "no action required if the final callback is strong.",
    }, INFO);
  }

  if (last?.narrative.purpose !== "payoff" && last?.narrative.purpose !== "cta") {
    flag({
      at: last?.start ?? -1,
      beat: last?.n,
      level: "warn",
      severity: "MED",
      rule: "weak-final-purpose",
      message: "final beat is not explicitly marked as payoff/close",
      reason: "the final minute should feel authored, not like the render simply ran out of narration.",
      fix: "mark the closing beat as payoff and let the callback land there.",
    }, 0.7);
  }

  return clampScore(score);
};

const scoreEvidence = (plan: ShortPlan, findings: QcFinding[]) => {
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  const proof = plan.beats.filter((b) => b.narrative.purpose === "proof");
  for (const b of proof) {
    const events = beatEvents(plan, b.n);
    const hasNumber = events.some((e) => e.type === "NUMBER_REVEAL");
    const hasAnnotation = events.some((e) => e.type === "ANNOTATION_DRAW");
    if (!hasNumber && !hasAnnotation) {
      flag({
        at: b.start,
        beat: b.n,
        level: "warn",
        severity: "MED",
        rule: "proof-without-evidence-event",
        message: `beat ${b.n} is a proof beat but contains no number/annotation event`,
        reason: "finance storytelling earns trust by letting the viewer see what is being proved.",
        fix: "stage the number, source highlight, chart, or document annotation that supports the spoken claim.",
      }, 0.45);
    }
  }

  return clampScore(score);
};

const scoreNovelty = (plan: ShortPlan, findings: QcFinding[]) => {
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  for (const run of modulesRun(plan)) {
    if (run.beats.length >= 3) {
      flag({
        at: plan.beats.find((b) => b.n === run.beats[0])?.start ?? -1,
        beat: run.beats[0],
        level: "warn",
        severity: "MED",
        rule: "longform-module-run",
        message: `${run.beats.length} consecutive beats use "${run.module}"`,
        reason: "repetition is especially visible in a documentary because narration can continue while the visual grammar stays unchanged.",
        fix: "change the frame language at a real argument turn; do not add decorative motion just to make it different.",
      }, 0.55);
    }
  }

  const distinct = new Set(plan.beats.map((b) => b.visual.module)).size;
  if (distinct < 5 && plan.beats.length >= 20) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "longform-low-visual-language",
      message: `only ${distinct} visual languages across ${plan.beats.length} beats`,
      reason: "the film needs multiple evidence languages: footage, documents, charts, interfaces, comparisons, and human-scale shots.",
      fix: "add or promote distinct visual languages at chapter turns; do not alternate modules mechanically.",
    }, 0.65);
  }

  return clampScore(score);
};

export const runLongFormQC = (
  plan: ShortPlan,
  curiosity: CuriosityState,
  firstVo: string,
): QcReport => {
  const findings: QcFinding[] = [];

  const hook = scoreHook(plan, firstVo, findings);
  const pacingResult = runLongFormPacingQC(plan);
  const pacing = pacingResult.score;
  findings.push(...pacingResult.findings);

  const curiosityScore = scoreCuriosity(plan, curiosity, findings);
  const visualResult = runVisualQC(plan);
  const audioResult = runAudioQC(plan);
  findings.push(...visualResult.findings, ...audioResult.findings);

  const evidence = scoreEvidence(plan, findings);
  const novelty = scoreNovelty(plan, findings);

  // Loop score is intentionally semantic. Visual/audio craft are still kept
  // in the report, but loop is computed from long-form closure rather than a
  // literal Short-style replay loop.
  const loop = scoreLoop(plan, findings);

  // Visual score is conservatively combined with our long-form novelty/evidence
  // audit instead of letting the legacy phone-specific checker dominate.
  const visualVariety = clampScore(
    visualResult.score * 0.55 + novelty * 0.25 + evidence * 0.20,
  );
  const audio = audioResult.score;

  const scores = {
    hook,
    pacing,
    curiosity: curiosityScore,
    visualVariety,
    audio,
    loop,
  };

  const craft =
    scores.hook * LONGFORM_WEIGHTS.hook +
    scores.pacing * LONGFORM_WEIGHTS.pacing +
    scores.curiosity * LONGFORM_WEIGHTS.curiosity +
    scores.visualVariety * LONGFORM_WEIGHTS.visualVariety +
    scores.audio * LONGFORM_WEIGHTS.audio +
    scores.loop * LONGFORM_WEIGHTS.loop;

  const proxy = runLongFormRetentionProxy(plan, curiosity, scores);
  const completionScore = clamp((proxy / 0.5) * 10, 0, 10);
  const overall = clampScore(craft * 0.75 + completionScore * 0.25);

  return {
    video: {
      title: plan.project.title,
      duration: plan.project.durationInSeconds,
      beats: plan.beats.length,
    },
    findings: findings.sort((a, z) => {
      const order = { FATAL: 0, HIGH: 1, MED: 2, LOW: 3, undefined: 4 } as const;
      const sa = order[(a.severity ?? "undefined") as keyof typeof order];
      const sz = order[(z.severity ?? "undefined") as keyof typeof order];
      if (sa !== sz) return sa - sz;
      if (a.at === -1) return 1;
      if (z.at === -1) return -1;
      return a.at - z.at;
    }),
    scores,
    projectedRetention: Number((proxy * 100).toFixed(1)),
    score: overall,
  };
};
