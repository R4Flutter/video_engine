// LongFormPacingQC: production pacing gate for long-form documentaries.
//
// IMPORTANT: this is not a Shorts/feed model.
// It evaluates editorial progression, not a fixed cut-per-second cadence.
// The score is comparative QA for versions of the same long-form project.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

const LONG_FORM_SECONDS = 120;
const REVIEW_GAP = 10;
const HIGH_GAP = 16;
const CRITICAL_GAP = 22;
const REVIEW_BEAT = 32;
const HIGH_BEAT = 48;
const STRONG_EVENT_DENSITY = 1.1;
const MIN_EVENT_DENSITY = 0.55;

const isLongForm = (plan: ShortPlan) => plan.project.durationInSeconds >= LONG_FORM_SECONDS;

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

const meaningfulEventsForBeat = (plan: ShortPlan, beatNumber: number) =>
  plan.attentionEvents.filter((e) => e.beat === beatNumber && meaningfulTypes.has(e.type));

const nonSilenceEvents = (plan: ShortPlan) =>
  plan.attentionEvents.filter((e) => meaningfulTypes.has(e.type)).sort((a, b) => a.at - b.at);

/**
 * Long-form pacing score 0..10.
 *
 * A documentary may hold a photograph, document, chart or B-roll shot for
 * several seconds. A hold is only a problem when the story also stops moving.
 * We therefore judge:
 *   1) unexplained state gaps,
 *   2) long beats with no internal progression,
 *   3) chapter/sequence rhythm,
 *   4) global meaningful-event cadence.
 *
 * No penalty exists for total runtime, average beat length, or 2–6 second
 * "dead frame" rules inherited from the Shorts model.
 */
export const runLongFormPacingQC = (plan: ShortPlan): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  const events = nonSilenceEvents(plan);

  // 1. State-change cadence. Thresholds are intentionally generous for
  // documentary evidence holds; they are review gates, not cut targets.
  let previous = 0;
  for (const e of events) {
    const gap = e.at - previous;
    if (gap >= CRITICAL_GAP) {
      flag({
        at: previous,
        level: "warn",
        severity: "HIGH",
        rule: "longform-critical-gap",
        message: `${gap.toFixed(1)}s without a meaningful visual/information event`,
        reason: "the edit provides no visible or structural progression for a long stretch.",
        fix: "stage a real evidence reveal, visual-state change, question, or sequence turn; do not add decorative motion.",
      }, 1.2);
    } else if (gap >= HIGH_GAP) {
      flag({
        at: previous,
        level: "warn",
        severity: "MED",
        rule: "longform-long-gap",
        message: `${gap.toFixed(1)}s between meaningful editorial events`,
        reason: "a long-form hold can work, but a prolonged gap should be justified by strong evidence or emotion.",
        fix: "review the hold; keep it only if the narration/evidence is genuinely advancing.",
      }, 0.6);
    } else if (gap >= REVIEW_GAP) {
      flag({
        at: previous,
        level: "info",
        severity: "LOW",
        rule: "longform-review-gap",
        message: `${gap.toFixed(1)}s between meaningful editorial events`,
        reason: "review flag only; a documentary evidence or emotional hold can legitimately live here.",
        fix: "no change required if the frame is carrying evidence or emotional weight.",
      }, 0.15);
    }
    previous = e.at;
  }

  const tail = plan.project.durationInSeconds - previous;
  if (tail >= CRITICAL_GAP) {
    flag({
      at: previous,
      level: "warn",
      severity: "HIGH",
      rule: "longform-ending-gap",
      message: `${tail.toFixed(1)}s after the last meaningful editorial event`,
      reason: "the ending should resolve into a deliberate payoff/callback rather than drift.",
      fix: "strengthen the closing evidence/payoff or create one explicit final event.",
    }, 1.0);
  }

  // 2. Long beats: allowed, but internal progression is required when a beat
  // becomes long enough that a single visual state is unlikely to carry it.
  for (const b of plan.beats) {
    const len = b.end - b.start;
    const internal = meaningfulEventsForBeat(plan, b.n).length;
    if (len >= HIGH_BEAT && internal === 0) {
      flag({
        at: b.start,
        beat: b.n,
        level: "warn",
        severity: "HIGH",
        rule: "unstaged-longform-beat",
        message: `${len.toFixed(1)}s beat with no internal editorial event`,
        reason: "this beat is long enough that one visual state carrying one thought needs a compelling documentary justification.",
        fix: "add a meaningful internal reveal or split only at a genuine narrative transition.",
      }, 1.0);
    } else if (len >= REVIEW_BEAT && internal === 0) {
      flag({
        at: b.start,
        beat: b.n,
        level: "info",
        severity: "MED",
        rule: "review-longform-beat",
        message: `${len.toFixed(1)}s beat with no internal editorial event`,
        reason: "review whether the narration and evidence are enough to sustain a single visual state.",
        fix: "add an internal reveal only when it improves understanding or anticipation.",
      }, 0.35);
    }
  }

  // 3. Meaningful-event cadence is a health signal, not a Shorts target.
  const minutes = Math.max(1, plan.project.durationInSeconds / 60);
  const density = events.length / minutes;
  if (density < MIN_EVENT_DENSITY) {
    flag({
      at: -1,
      level: "warn",
      severity: "HIGH",
      rule: "low-longform-event-density",
      message: `${density.toFixed(2)} meaningful events/minute`,
      reason: "the edit may contain large stretches where neither the visual state nor the information state advances.",
      fix: "add semantic reveals, evidence changes, questions or sequence turns—not decorative camera motion.",
    }, 1.0);
  } else if (density < STRONG_EVENT_DENSITY) {
    flag({
      at: -1,
      level: "info",
      severity: "LOW",
      rule: "moderate-longform-event-density",
      message: `${density.toFixed(2)} meaningful events/minute`,
      reason: "acceptable documentary cadence; inspect chapter transitions and the longest holds.",
      fix: "no automatic change required.",
    }, 0.1);
  }

  // 4. Sequence rhythm. Major phases should have explicit chapter turns.
  const sequenceIds = [...new Set(plan.beats.map((b) => b.sequenceId).filter(Boolean))];
  if (sequenceIds.length < 5) {
    flag({
      at: -1,
      level: "warn",
      severity: "MED",
      rule: "weak-sequence-rhythm",
      message: `${sequenceIds.length} editorial sequences across ${plan.beats.length} beats`,
      reason: "a 19-minute documentary benefits from clear chapter-level turns rather than one continuous explanatory block.",
      fix: "ensure major narrative phases reset their question, visual grammar or evidence mode.",
    }, 0.5);
  } else if (sequenceIds.length >= 8) {
    score += 0.35;
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};

export const runFormatAwarePacingQC = (plan: ShortPlan) =>
  isLongForm(plan) ? runLongFormPacingQC(plan) : null;
