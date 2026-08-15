// EmotionalCurve: the register, beat to beat.
//
// A Short that sits in one register for thirty seconds is flat no matter how
// good the visuals are — and flat is indistinguishable from over, which is
// why the viewer leaves. The curve drives camera, music, silence and the
// swipe model's intensity term.
//
// `recognition` is on this list and not on the essay's for a reason: in
// personal finance, "that is me, right now" is the strongest response a line
// can get. It is what makes someone send the video to a friend.
import type { Emotion, Script, ScriptBeat } from "../types.ts";
import { progress } from "../util.ts";

const EMOTION_WORDS: [RegExp, Emotion][] = [
  [/\b(you (still|already|have|forgot)|right now|every month|your (bank|paycheck|account))\b/i, "recognition"],
  [/\b(nobody|quietly|never told|hidden|silent|they don'?t)\b/i, "indignation"],
  [/\b(lost|losing|leak|drain|costing|worse|gone)\b/i, "tension"],
  [/\b(turns out|actually|isn'?t|not the|except|but)\b/i, "surprise"],
  [/\b(so|which means|that'?s|the math|simply|just)\b/i, "clarity"],
  [/\b(fix|cancel|stop|two taps|takes a minute|easy)\b/i, "relief"],
  [/\b(a year|total|adds up|paid for nothing|worth)\b/i, "satisfaction"],
];

const hinted = (b: ScriptBeat): Emotion | undefined =>
  EMOTION_WORDS.find(([re]) => re.test(`${b.vo} ${b.visual} ${b.text ?? ""}`))?.[1];

/** The default arc when a beat's language says nothing: curiosity into
 *  recognition into tension, resolved by clarity and satisfaction. */
const POSITIONAL: [number, Emotion][] = [
  [0.0, "curiosity"],
  [0.2, "recognition"],
  [0.45, "tension"],
  [0.65, "surprise"],
  [0.82, "clarity"],
  [0.95, "satisfaction"],
];

export const emotionFor = (b: ScriptBeat, all: ScriptBeat[]): Emotion => {
  if (b.emotion) {
    const m = EMOTION_WORDS.find(([re]) => re.test(b.emotion!));
    if (m) return m[1];
    const named = (
      ["curiosity", "surprise", "tension", "recognition", "indignation", "clarity", "relief", "satisfaction"] as Emotion[]
    ).find((e) => b.emotion!.toLowerCase().includes(e));
    if (named) return named;
  }
  const h = hinted(b);
  if (h) return h;
  const p = progress(b, all);
  return POSITIONAL.reduce((acc, [t, e]) => (p >= t ? e : acc), "curiosity" as Emotion);
};

/** The curve, with an anti-flatness pass: no two adjacent beats share a
 *  register unless the author pinned it. */
export const buildEmotionalCurve = (script: Script): Emotion[] => {
  const beats = script.beats;
  const curve = beats.map((b) => emotionFor(b, beats));
  const ALTS: Emotion[] = ["clarity", "tension", "surprise", "recognition", "curiosity"];
  for (let i = 1; i < curve.length; i++) {
    if (curve[i] === curve[i - 1] && !beats[i].emotion) {
      curve[i] = ALTS.find((e) => e !== curve[i]) ?? "curiosity";
    }
  }
  return curve;
};
