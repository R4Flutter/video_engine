// LongFormPacingQC: format-aware pacing for long-form documentary edits.
//
// This is intentionally separate from the Shorts/feed pacing model.
// It evaluates whether a long-form documentary changes meaningfully over time,
// not whether every frame changes every few seconds.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

const SOFT_GAP = 8;
const MED_GAP = 12;
const HIGH_GAP = 18;
const SOFT_LONG_BEAT = 30;
const HIGH_LONG_BEAT = 45;
const LOW_EVENT_DENSITY = 0.75; // meaningful events / minute
const STRONG_EVENT_DENSITY = 1.25;

const isLongForm = (plan: ShortPlan) => plan.project.durationInSeconds >= 120;

const eventCountsByBeat = (plan: ShortPlan) => {
  const map = new Map<number, number>();
  for (const e of plan.attentionEvents) map.set(e.beat, (map.get(e.beat) ?? 0) + 1);
  return map;
};

const meaningfulEventCount = (plan: ShortPlan, beatNumber: number) => {
  const meaningful = new Set([
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
  return plan.attentionEvents.filter((e) => e.beat === beatNumber && meaningful.has(e.type)).length;
};

/**
 * Long-form pacing score 0..10.
 *
 * The score rewards meaningful editorial progression and only penalizes holds
 * that lack an information, visual, emotional, or structural reason.
 */
export const runLongFormPacingQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const eventCounts = eventCountsByBeat(plan);

  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  // A long-form film may legitimately hold a frame. Penalize only when a
  // long gap has no staged information and no beat-level narrative purpose.
  const sorted = [...plan.attentionEvents].sort((a, b) => a.at - b.at);
  let last = 0;
  for (const e of sorted) {
    const gap = e.at - last;
    if (gap > HIGH_GAP) {
      flag({
        at: last,
        level: "warn",
        severity: "HIGH",
        rule: "longform-dead-zone",
        message: `${gap.toFixed(1)}s without a meaningful editorial event`,
        reason: "a long-form hold is acceptable only when the narration/evidence continues to progress.",
        fix: "stage an evidence reveal, state change, question, graphic update, or cut earlier.",
      }, 1.3);
    } else if (gap > MED_GAP) {
      flag({
        at: last,
        level: "warn",
        severity: "MED",
        rule: "longform-slow-zone",
        message: `${gap.toFixed(1)}s between meaningful editorial events`,
        reason: "the viewer should receive a visible or narrative change before a long uninterrupted stretch becomes inert.",
        fix: "add a meaningful internal reveal or change visual state.",
      }, 0.6);
    } else if (gap > SOFT_GAP) {
      flag({
        at: last,
        level: "info",
        severity: "LOW",
        rule: "longform-hold",
        message: `${gap.toFixed(1)}s between meaningful events`,
        reason: "acceptable for evidence or cinematic holds, but review the shot for visual purpose.",
        fix: "no change required if the frame is carrying evidence or emotion.",
      }, 0.2);
    }
    last = e.at;
  }
  const tail = plan.project.durationInSeconds - last;
  if (tail > HIGH_GAP) {
    flag({
      at: last,
      level: "warn",
      severity: "HIGH",
      rule: "longform-tail-gap",
      message: `${tail.toFixed(1)}s after the last meaningful event`,
      reason: "the ending must resolve rather than drift.",
      fix: "strengthen the final payoff/callback or add a deliberate closing event.",
    }, 1.0);
  }

  // Beat structure: long beats are allowed when they contain staged internal
  // events or have a defensible documentary purpose.
  for (const b of plan.beats) {
    const len = b.end - b.start;
    const events = meaningfulEventCount(plan, b.n);
    const strategy = b.narrative.purpose;
    if (len > HIGH_LONG_BEAT && events === 0) {
      flag({
        at: b.start,
        beat: b.n,
        level: "warn",
        severity: "HIGH",
        rule: "unstaged-longform-beat",
        message: `${len.toFixed(1)}s beat without an internal editorial event`,
        reason: `the beat is ${strategy} but has no staged visual/narrative change inside it.`,
        fix: "add one or more meaningful internal reveals, or split the beat at a real narrative transition.",
      }, 1.2);
    } else if (len > SOFT_LONG_BEAT && events === 0) {
      flag({
        at: b.start,
        beat: b.n,
        level: "info",
        severity: "MED",
        rule: "longform-review-beat",
        message: `${len.toFixed(1)}s beat with no staged internal event`,
        reason: "long-form can sustain a single visual, but this beat deserves editorial review.",
        fix: "add a staged reveal only where it serves the narration.",
      }, 0.5);
    }
  }

  // Event density is evaluated globally, not against Shorts-style 2–4s cuts.
  const minutes = Math.max(1, plan.project.durationInSeconds / 60);
  const meaningfulEvents = plan.attentionEvents.filter((e) =>
    !["SILENCE"].includes(e.type)
  ).length;
  const density = meaningfulEvents / minutes;
  if (density < LOW_EVENT_DENSITY) {
    flag({
      at: -1,
      level: "warn",
      severity: "HIGH",
      rule: "low-longform-event-density",
      message: `${density.toFixed(2)} meaningful events/minute`,
      reason: "long-form needs a visible or narrative progression cadence even when shots are held.",
      fix: "increase meaningful reveals, evidence changes, questions, or sequence turns rather than adding decorative motion.",
    }, 1.0);
  } else if (density < STRONG_EVENT_DENSITY) {
    flag({
      at: -1,
      level: "info",
      severity: "LOW",
      rule: "moderate-longform-event-density",
      message: `${density.toFixed(2)} meaningful events/minute`,
      reason: "healthy range for a documentary hold-based edit, but more chapter-level progression can still help.",
      fix: "no automatic change required.",
    }, 0.15);
  }

  // Chapter/sequence turns: reward purposeful structure.
  const sequenceIds = new Set(plan.beats.map((b) => b.sequenceId));
  const sequenceCount = sequenceIds.size;
  if (sequenceCount >= 6) score += 0.5;
  else if (sequenceCount < 4) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "weak-chapter-rhythm",
      message: `${sequenceCount} editorial sequences across ${plan.beats.length} beats`,
      reason: "long-form retention benefits from clear chapter-level turns and changing questions.",
      fix: "ensure the director recognizes major narrative phases and resets visual language between them.",
    }, 0.5);
  }

  // Protect cinematic/documentary holds from the old Shorts model.
  // No penalties for total runtime or average beat length in long-form mode.

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};

export const runFormatAwarePacingQC = (plan: ShortPlan) => {
  if (isLongForm(plan)) return runLongFormPacingQC(plan);
  // LongFormPacingQC is intentionally only selected for long-form projects.
  // The legacy short-form implementation remains the caller's responsibility.
  return null;
};
