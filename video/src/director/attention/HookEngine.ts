// HookEngine: the first frame and the first three seconds.
//
// This module exists because of one measured failure. The previous upload's
// frame one was a blank page — the on-screen hook assembled word by word and
// the complete claim did not exist until second five. A thumb decides in
// roughly four tenths of a second, so the video was being judged on an empty
// beige rectangle while the good part was still being typed out underneath.
//
// The rule this encodes: comprehension first, motion second. The complete
// hook is legible on frame one at the largest type in the video, held long
// enough to be read, and only then does anything animate. Kinetic reveals are
// a fine device — for beat three, not beat one.
//
// The engine also names *which* hook lever the script pulled, because a
// channel that opens every video the same way trains its own audience to
// swipe.
import type { FrameZero, HookType, Script, ScriptBeat } from "../types.ts";
import { clamp, firstWords, overlap, round2, words } from "../util.ts";

/** What a viewer reliably reads in a glance at Shorts type size. Past this
 *  the hook is a paragraph and the thumb has already moved. Six words fits on
 *  two lines at the largest type a 1080-wide frame can carry. */
const GLANCE_CHARS = 34;
const GLANCE_WORDS = 6;

/** The minimum the complete hook is held before anything moves under it.
 *  0.5s at 30fps — long enough to read, short enough not to feel frozen. */
const MIN_HOLD_SECONDS = 0.5;

const HOOK_PATTERNS: [RegExp, HookType][] = [
  // Order matters: the most specific lever wins. A line can be two things,
  // and the one it leads with is the one doing the work.
  [/\b(isn'?t|is not|aren'?t|not the|won'?t|doesn'?t|never)\b/i, "contradiction"],
  [/\b(you (still|already|just)|you have|you'?re paying|right now|every month)\b/i, "recognition"],
  [/[$₹€£]\s?\d|\b\d+(\.\d+)?%|\b\d{2,}\b/, "specificity"],
  [/\b(losing|lost|costing|bleeding|quietly took|silent|leak)\b/i, "negative_urgency"],
  [/\b(two|second|hidden|nobody|almost no one|they don'?t (show|tell))\b/i, "curiosity_gap"],
];

export const hookTypeOf = (line: string): HookType =>
  HOOK_PATTERNS.find(([re]) => re.test(line))?.[1] ?? "unknown";

/** Where in the narration the claim is complete. A claim is complete at the
 *  end of its first sentence — that is the unit a viewer evaluates. */
export const timeToClaim = (b: ScriptBeat): number => {
  const dur = b.end - b.start;
  const all = words(b.vo);
  if (!all.length) return dur;
  const firstSentence = b.vo.split(/(?<=[.!?])\s/)[0] ?? b.vo;
  const spoken = words(firstSentence).length;
  // Beat-relative, assuming an even read inside the beat. align.py replaces
  // this with the real word timings once a take exists; until then the even
  // spread is the honest estimate.
  return round2(b.start + dur * clamp(spoken / all.length, 0, 1));
};

/**
 * The frame-zero contract.
 *
 * `text` is what must be fully rendered on frame 1. Preference order:
 *   1. an explicit `Hook:` row — the author writing the frame by hand
 *   2. the beat's on-screen text
 *   3. the first sentence of the narration, upper-cased
 *
 * `holdFrames` is how long the renderer keeps that complete text still. It
 * scales with length, because a six-word hook needs longer to read than a
 * three-word one, and it is never zero.
 */
export const planFrameZero = (script: Script): FrameZero => {
  const b = script.beats[0];
  const fps = script.fps || 30;
  if (!b) {
    return {
      text: "",
      source: "narration",
      words: 0,
      chars: 0,
      holdFrames: 0,
      size: "max",
      glanceable: false,
      audioSynced: false,
      hookType: "unknown",
      timeToClaim: 0,
    };
  }

  const spokenOpen = b.vo.split(/(?<=[.!?])\s/)[0] ?? b.vo;
  // The fallback chain keeps the render from ever being blank. It does not
  // make an unwritten hook acceptable — `source` records which rung we landed
  // on so HookQC can tell "the author wrote a long hook" (fixable) apart from
  // "nobody wrote one and this is the first sentence of the script" (fatal).
  const source: FrameZero["source"] = b.hook?.trim() ? "hook" : b.text?.trim() ? "text" : "narration";
  const text = (b.hook?.trim() || b.text?.trim() || spokenOpen.trim()).replace(/\s+/g, " ");
  const w = words(text).length;
  const chars = text.length;

  // A longer hook needs longer on screen, but never more than a third of the
  // beat — past that the video has stopped moving and stillness reads as a
  // frozen render.
  const dur = b.end - b.start;
  const readSeconds = clamp(MIN_HOLD_SECONDS + (chars - 18) * 0.022, MIN_HOLD_SECONDS, dur * 0.34);

  return {
    text: text.toUpperCase(),
    source,
    words: w,
    chars,
    holdFrames: Math.round(readSeconds * fps),
    // The hook is always the largest type in the video. "large" only when the
    // line is long enough that max would wrap past three lines.
    size: chars <= 34 ? "max" : "large",
    glanceable: w <= GLANCE_WORDS && chars <= GLANCE_CHARS,
    // Hook sync: the strongest signal available. The viewer hears what they
    // are reading, so the claim lands twice in the same half-second.
    audioSynced: overlap(text, firstWords(b.vo, 12)) >= 0.6,
    hookType: hookTypeOf(`${text} ${spokenOpen}`),
    timeToClaim: timeToClaim(b),
  };
};

/** Openers that spend the most valuable second of the video on nothing.
 *  Every one of these is a phrase the viewer has heard a thousand times, so
 *  it carries no information and reads as "this is going to take a while". */
export const DEAD_OPENERS =
  /^\s*(so|okay|ok|alright|hey|hi|hello|welcome|guys|listen|look|now|today|in this (video|short)|let'?s (talk|start)|i want to|i'?m going to|did you know)\b/i;
