// RhythmEngine: how often something has to change.
//
// The essay engine allows a frame to hold for thirty seconds if the idea
// earns it. A Short does not get that budget. The tiers here are far tighter,
// and the engine's real job is scheduling *internal* change events so that a
// five-second beat is five seconds of movement rather than one static card
// held five times too long.
//
// Events are laid on a regular cadence rather than at random offsets: a
// viewer senses a pattern before they sense randomness, and pattern reads as
// competence.
import type {
  AttentionEvent,
  AttentionEventType,
  Emotion,
  Script,
  ScriptBeat,
} from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import { rng, round2, type Rng } from "../util.ts";

export type RhythmDecision = {
  tier: "FLASH" | "MICRO" | "IDEA" | "OVERLONG";
  /** Seconds between internal change events on this beat. */
  cadence: number;
  /** True when the beat is long enough that it must restage itself inside. */
  needsInternalChange: boolean;
};

const tierOf = (dur: number): RhythmDecision => {
  if (dur < 2) return { tier: "FLASH", cadence: 1, needsInternalChange: false };
  if (dur < 4) return { tier: "MICRO", cadence: 1.4, needsInternalChange: false };
  if (dur < 7) return { tier: "IDEA", cadence: 1.8, needsInternalChange: true };
  return { tier: "OVERLONG", cadence: 2.0, needsInternalChange: true };
};

export const rhythmFor = (b: ScriptBeat): RhythmDecision => tierOf(b.end - b.start);

/** The event vocabulary a beat's own content earns. */
const EVENT_POOL: [RegExp, AttentionEventType][] = [
  [/\?|^why|^what|^how|guess\b/i, "QUESTION"],
  [/[$₹€£]\s?\d|\d+(\.\d+)?%|\b\d[\d,]{2,}\b/, "NUMBER_REVEAL"],
  [/\b(but|however|except|turns out|actually|isn'?t|not the|instead)\b/i, "CONTRADICTION"],
  [/\b(cancel|open|tap|check|swipe|look)\b/i, "OBJECT_ENTRY"],
  [/\b(chart|graph|line|curve|bar|stack|drain|fill)\b/i, "ANNOTATION_DRAW"],
  [/\b(gone|lost|leaking|silent|quietly|paid for nothing)\b/i, "REVEAL"],
];

export const scheduleBeatEvents = (
  b: ScriptBeat,
  facts: BeatFacts,
  decision: RhythmDecision,
  emotion: Emotion,
  isFirst: boolean,
  holdSeconds: number,
): AttentionEvent[] => {
  const events: AttentionEvent[] = [];
  const r: Rng = rng(b.n * 7919 + 17);
  const dur = b.end - b.start;

  const source = `${b.vo} ${b.visual} ${b.text ?? ""}`;
  const pooled = EVENT_POOL.filter(([re]) => re.test(source)).map((x) => x[1]);
  if (facts.question && !pooled.includes("QUESTION")) pooled.unshift("QUESTION");
  if (facts.reveal && !pooled.includes("REVEAL")) pooled.push("REVEAL");
  if (!pooled.length) pooled.push("TEXT_CHANGE");

  // Every beat opens with a change — the cut itself is the first event, and
  // the swipe model reads it as "something happened here".
  events.push({
    at: round2(b.start),
    type: isFirst ? "PATTERN_INTERRUPT" : "TEXT_CHANGE",
    beat: b.n,
    strength: isFirst ? 1 : 0.6,
    label: b.text?.slice(0, 28),
  });

  // Beat one holds its complete hook still before anything else moves. That
  // hold is the point; scheduling events inside it would undo it.
  let t = b.start + Math.max(holdSeconds, decision.cadence * 0.6);
  let i = 0;
  while (t < b.end - 0.4) {
    const type = pooled[i % pooled.length];
    const strength =
      type === "REVEAL" || type === "QUESTION" || type === "CONTRADICTION"
        ? 0.85
        : round2(0.5 + r() * 0.3);
    events.push({
      at: round2(t),
      type,
      beat: b.n,
      strength,
      label: b.text?.slice(0, 28),
    });
    t += decision.cadence * (0.85 + r() * 0.3);
    i += 1;
  }

  // Tension holds its reveal back; curiosity front-loads its question.
  if (emotion === "tension" || emotion === "curiosity") {
    const reveal = events.find((e) => e.type === "REVEAL");
    if (reveal) reveal.at = round2(Math.min(b.end - 0.4, b.start + dur * 0.72));
  }

  return events.sort((a, z) => a.at - z.at);
};

export const scheduleAllEvents = (
  script: Script,
  facts: BeatFacts[],
  emotions: Emotion[],
  decisions: RhythmDecision[],
  holdSeconds: number,
): AttentionEvent[] =>
  script.beats
    .flatMap((b, i) =>
      scheduleBeatEvents(b, facts[i], decisions[i], emotions[i], i === 0, i === 0 ? holdSeconds : 0),
    )
    .sort((a, z) => a.at - z.at);
