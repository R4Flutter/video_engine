// LongFormHookQC: production hook QA for long-form documentaries.
// The opening is judged as an actual retention sequence: immediate promise,
// second confirmation, early contradiction, and concrete claim latency.
import type { QcFinding, ShortPlan } from "../types.ts";
import { clamp } from "../util.ts";

const INTRO_WINDOW = 30;
const MAX_CLAIM_LATENCY = 12;
const HARD_CLAIM_LATENCY = 20;
const MAX_SILENT_HOLD = 4;
const MAX_OPENING_TEXT = 42;
const FIRST_EVENT_DEADLINE = 2;
const SECOND_EVENT_DEADLINE = 5;
const FIRST_QUESTION_DEADLINE = 5;

const meaningful = new Set([
  "TEXT_CHANGE",
  "NUMBER_REVEAL",
  "OBJECT_ENTRY",
  "ANNOTATION_DRAW",
  "QUESTION",
  "REVEAL",
  "CONTRADICTION",
  "PAYOFF",
  "PATTERN_INTERRUPT",
]);

export const runLongFormHookQC = (
  plan: ShortPlan,
  firstVo: string,
): { findings: QcFinding[]; score: number } => {
  const findings: QcFinding[] = [];
  let score = 10;
  const flag = (f: QcFinding, penalty: number) => {
    findings.push(f);
    score -= penalty;
  };

  const first = plan.beats[0];
  const introBeats = plan.beats.filter((b) => b.start < INTRO_WINDOW);
  const introEvents = plan.attentionEvents
    .filter((e) => e.at < INTRO_WINDOW && meaningful.has(e.type))
    .sort((a, b) => a.at - b.at);

  if (!first) {
    return { findings: [{ at: -1, level: "warn", severity: "FATAL", rule: "missing-opening-beat", message: "no opening beat exists", fix: "provide beat 1" }], score: 0 };
  }

  const fz = plan.frameZero;
  if (!fz.text.trim()) {
    flag({ at: 0, beat: 1, level: "warn", severity: "FATAL", rule: "blank-longform-frame-zero", message: "opening frame has no authored visual anchor", reason: "long-form viewers still need immediate orientation and a reason to continue.", fix: "author a concise evidence/claim/contradiction line or deliberate visual anchor." }, 4);
  }

  if (!fz.glanceable || fz.chars > MAX_OPENING_TEXT) {
    flag({ at: 0, beat: 1, level: "warn", severity: "HIGH", rule: "opening-text-overload", message: `${fz.words} words / ${fz.chars} chars on the opening frame`, reason: "the opening should be decoded quickly even on a large-screen or mobile viewing context.", fix: "shorten the visual claim; let narration carry qualifiers." }, 1.2);
  }

  if (fz.text.trim() && fz.audioSynced) {
    // Visual and spoken framing reinforce each other.
  } else if (fz.text.trim()) {
    flag({ at: 0, beat: 1, level: "warn", severity: "MED", rule: "opening-desync", message: "opening visual claim differs from the first spoken line", reason: "mismatched claims make the viewer reconcile two messages at once.", fix: "make the visual a concise subset of the first spoken claim, unless the mismatch is an intentional visual contradiction." }, 0.6);
  }

  const firstEventAt = introEvents.find((e) => e.at >= 0)?.at ?? Infinity;
  if (!Number.isFinite(firstEventAt) || firstEventAt > FIRST_EVENT_DEADLINE) {
    flag({ at: 0, beat: 1, level: "warn", severity: "HIGH", rule: "late-first-event", message: `no meaningful editorial event lands by ${FIRST_EVENT_DEADLINE}s`, reason: "the opening must begin progressing immediately; a long-form breath cannot become a dead cold open.", fix: "stage PATTERN_INTERRUPT, CONTRADICTION, NUMBER_REVEAL, or OBJECT_ENTRY at frame 0–2s." }, 1.2);
  }

  const secondEvent = introEvents.find((e) => e.at > FIRST_EVENT_DEADLINE && e.at <= SECOND_EVENT_DEADLINE);
  if (!secondEvent) {
    flag({ at: 2, beat: 1, level: "warn", severity: "HIGH", rule: "late-second-event", message: "no second meaningful opening event lands by 5s", reason: "the first visual promise should be confirmed before the audience settles into exposition.", fix: "add a NUMBER_REVEAL or OBJECT_ENTRY while preserving the same visual subject; prefer a motivated push over an arbitrary cut." }, 0.9);
  }

  const firstContradiction = introEvents.find((e) => e.type === "CONTRADICTION" || e.type === "NUMBER_REVEAL" || e.type === "QUESTION");
  if (!firstContradiction || firstContradiction.at > FIRST_QUESTION_DEADLINE) {
    flag({ at: 0, level: "warn", severity: "MED", rule: "late-contradiction", message: `opening contradiction/question arrives after ${FIRST_QUESTION_DEADLINE}s`, reason: "the curiosity gap should widen early rather than waiting for explanatory exposition.", fix: "surface the strongest existing contradiction, number or question by ~5s." }, 0.7);
  }

  const firstPayoff = introEvents.find((e) => e.type === "REVEAL" || e.type === "PAYOFF");
  const claimTime = firstPayoff?.at ?? (plan.beats.find((b) => b.narrative.purpose === "reveal" || b.narrative.purpose === "payoff")?.start ?? Infinity);
  if (!Number.isFinite(claimTime) || claimTime > MAX_CLAIM_LATENCY) {
    flag({ at: 0, level: "warn", severity: claimTime > HARD_CLAIM_LATENCY ? "HIGH" : "MED", rule: "longform-late-claim", message: `opening payoff/claim is not visually staged until ${Number.isFinite(claimTime) ? claimTime.toFixed(1) : "late"}s`, reason: "the first 30 seconds should deliver a concrete reason to keep watching while leaving the larger mechanism unresolved.", fix: "stage the strongest existing evidence/reveal earlier; do not invent a new narration line." }, claimTime > HARD_CLAIM_LATENCY ? 1.4 : 0.7);
  }

  const silentTail = introBeats
    .filter((b) => b.start < INTRO_WINDOW)
    .map((b) => ({ b, events: introEvents.filter((e) => e.beat === b.n) }))
    .filter(({ b, events }) => b.end - b.start > MAX_SILENT_HOLD && events.length === 0);
  for (const { b } of silentTail) {
    flag({ at: b.start, beat: b.n, level: "warn", severity: "MED", rule: "intro-unstaged-hold", message: `${(b.end - b.start).toFixed(1)}s opening beat without internal event`, reason: "the opening deserves deliberate progression rather than one static state for an extended stretch.", fix: "add a meaningful internal visual/evidence state or end the beat at a real transition." }, 0.4);
  }

  if (!firstVo.trim()) {
    flag({ at: 0, beat: 1, level: "warn", severity: "HIGH", rule: "missing-opening-voice", message: "no opening narration is available to validate", fix: "provide the aligned first voice take." }, 1.2);
  }

  return { findings, score: Number(clamp(score, 0, 10).toFixed(1)) };
};
