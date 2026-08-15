// What the hands do, and when.
//
// A talking head with a perfect mouth and dead arms is worse than a crude
// mouth and live arms — people read intent off the body long before they read
// phonemes off the lips. So this file gets as much care as mouth.ts.
//
// Two halves:
//   1. plan()  — reading the script and deciding which pose goes where
//   2. (the poses themselves live in poses.ts now)
//
// The vocabulary is deliberately short. Ten gestures used well look authored;
// thirty used at random look like a screensaver.

import type { GestureCue } from "./types";
import { SPECS } from "./poses";

export { poseAt } from "./poses";
export type { GestureCue };

// -------------------------------------------------------------- inference
//
// Matching on words is a blunt instrument and it knows it. Each rule carries a
// weight for how confident its trigger is: a literal "on the other hand" means
// a comparison and nothing else, while a stray "up" might be "up to you".
//
// But the weights alone are not enough, and the first version of this file
// proved it. Run over a finance script, every phrase contains a figure, the
// numeric rule fired on all of them, and the character spent forty seconds
// making the identical raised-hand gesture. It was, technically, correctly
// inferred. It looked like a broken loop.
//
// So the score a candidate gets is its weight minus what it has done lately.
// Repeating the pose that is already on screen is nearly disqualifying;
// repeating one from the last few seconds is a real penalty. The effect is
// that a script which triggers the same rule ten times still produces ten
// different-looking moments, because the second-best reading of a phrase is
// usually fine and always better than the same arm twice.

type Rule = { pose: string; test: RegExp; weight: number };

const RULES: Rule[] = [
  { pose: "halt", test: /\b(but|however|wait|stop|careful|catch|except|problem|mistake|wrong|never)\b/i, weight: 5 },
  { pose: "weigh", test: /\b(versus|vs|compared|than|either|whereas|other hand|difference|instead)\b/i, weight: 5 },
  { pose: "shrug", test: /\b(why|who|anyone|nobody|somehow|whatever|obviously|of course|nothing)\b|\?$/i, weight: 4 },
  { pose: "rise", test: /\b(grow|grows|growth|compound|compounds|compounding|doubles?|triples?|rises?|climb|climbs|higher|gain|gains|multiplies|becomes)\b/i, weight: 4 },
  { pose: "fall", test: /\b(lose|loses|lost|losing|drop|drops|falls?|lower|shrink|shrinks|fees?|inflation|taxe?s?|cost|costs)\b/i, weight: 4 },
  { pose: "wide", test: /\b(everything|everyone|entire|whole|huge|massive|enormous|fortune|rest of your life|forever)\b/i, weight: 4 },
  { pose: "pinch", test: /\b(tiny|small|little|barely|slightly|fraction|a bit|one percent)\b/i, weight: 4 },
  { pose: "weigh", test: /\b(same|equal|equally|both|split|divide|divided)\b/i, weight: 4 },
  { pose: "point_up", test: /\b(first|one thing|here'?s|this is|the point|remember|key|rule|listen)\b/i, weight: 3 },
  { pose: "chest", test: /\b(honestly|truth|really|actually|believe|i'?d|my own|your|you)\b/i, weight: 3 },
  { pose: "point_side", test: /\b(look|see|watch|notice|chart|graph|plot|line|this|that|here|there|today|now)\b/i, weight: 3 },
  { pose: "offer", test: /\b(means|so|therefore|which is|that'?s|equals|gives|simply|just|start|starts|begin)\b/i, weight: 2 },
  { pose: "count", test: /\b(and|then|next|also|second|third|another|plus|add|adds|every|each|per|year by year)\b/i, weight: 2 },
];

/**
 * Any figure, written or spoken.
 *
 * The digits-only version of this test found almost nothing, and the reason is
 * worth writing down: these phrases come from the *aligner*, which transcribes
 * what was said. Nobody says "dollar sign nine six comma zero zero zero" — the
 * take says "ninety-six thousand", and the caption's "$96,000" never appears
 * in a word list. Matching the spelling of the script is matching the wrong
 * document.
 */
const NUMERIC =
  /\d|\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|crore|million|billion|trillion|dozen|half)\b/i;
/** A figure big enough that the gesture for it is scale, not counting. */
const BIG = /\b(thousand|lakh|crore|million|billion|trillion)\b|\d[\d,]{4,}/i;
/** A figure whose point is how small it is. */
const SMALL = /%|\bpercent\b|\bpoint\s+\d|\b0\.\d/i;

/**
 * The gesture a phrase full of numbers wants, which depends entirely on what
 * kind of number it is. "Half a percent" and "five hundred thousand" are both
 * numeric and they are opposite gestures.
 */
function numericPose(text: string): string | null {
  if (!NUMERIC.test(text)) return null;
  if (SMALL.test(text)) return "pinch";
  if (BIG.test(text)) return "wide";
  return "count";
}

export type Word = { w: string; start: number; end: number };

/**
 * Split a take into phrases at punctuation and at silences.
 *
 * A gesture belongs to a phrase, not a word. Gesturing per word is the thing
 * that makes automated character animation look automated; gesturing per
 * phrase is roughly what people do, because the arm is illustrating the idea
 * and the idea is the clause.
 */
function toPhrases(words: Word[], gap = 0.22): Word[][] {
  const out: Word[][] = [];
  for (const w of words) {
    const last = out[out.length - 1];
    const broke =
      !last ||
      /[.?!,;:—]$/.test(last[last.length - 1].w) ||
      w.start - last[last.length - 1].end > gap ||
      last.length >= 9;
    if (broke) out.push([w]);
    else last.push(w);
  }
  return out;
}

/** Minimum seconds between two gesture starts. Below about 0.9s the previous
 *  pose has not arrived before the next one leaves and both read as noise. */
const MIN_APART = 0.95;

/**
 * Gesture cues for one beat's take.
 *
 * `notes` is anything hand-written in the script — see plan() below. A written
 * cue always wins, on the principle the rest of this codebase already runs on:
 * a human who bothered to name the gesture knows something the regex does not.
 */
export function planBeat(
  words: Word[],
  offset: number,
  notes: GestureCue[] = [],
  history: GestureCue[] = [],
): GestureCue[] {
  const cues: GestureCue[] = [...notes];
  /** Everything already on the timeline, so the penalties can see across beat
   *  boundaries. A beat break is not a licence to repeat the last gesture. */
  const seen = [...history, ...notes];
  const phrases = toPhrases(words);

  for (const phrase of phrases) {
    const text = phrase.map((w) => w.w).join(" ");
    const start = offset + phrase[0].start;
    const end = offset + phrase[phrase.length - 1].end;
    // Too short to land a pose. Left on `talk`, which is not nothing.
    if (end - start < 0.5) continue;
    if (cues.some((c) => Math.abs(c.t - start) < MIN_APART)) continue;

    const candidates = new Map<string, number>();
    for (const rule of RULES) {
      if (!rule.test.test(text)) continue;
      candidates.set(rule.pose, Math.max(candidates.get(rule.pose) ?? 0, rule.weight));
    }
    const num = numericPose(text);
    if (num) candidates.set(num, Math.max(candidates.get(num) ?? 0, 3));
    if (!candidates.size) continue;

    const last = seen.length ? seen[seen.length - 1] : null;
    let pick: string | null = null;
    let bestScore = -Infinity;
    for (const [pose, weight] of candidates) {
      // Back-to-back is what makes it look mechanical, so it costs more than
      // any rule is worth. Recently is merely expensive. Neither penalty is
      // permanent: a speaker who makes the same gesture twice in forty seconds
      // is a speaker, and one who never repeats is a shuffle.
      const recent = seen.some((c) => c.pose === pose && start - c.t < 6);
      const echo = last?.pose === pose && start - last.t < 5;
      const score = weight - (echo ? 6 : 0) - (recent ? 2 : 0);
      if (score > bestScore) {
        bestScore = score;
        pick = pose;
      }
    }
    // The only reading of this phrase is the pose already on screen, and it
    // only just got there. Holding is better than twitching.
    if (!pick || (pick === last?.pose && start - last.t < 3)) continue;

    // The gesture leads the phrase very slightly. Hands move before the words
    // arrive — a gesture that starts on the word it illustrates already looks
    // late, because the viewer's eye reached the hand first.
    const cue = { t: Math.max(offset, start - 0.12), pose: pick, hold: end - start };
    cues.push(cue);
    seen.push(cue);
  }

  return cues.sort((a, b) => a.t - b.t);
}

/** The written form: `Gesture: point_up @1.2` in a beat's motion or visual row.
 *  Time is seconds into the beat and may be omitted, meaning "at the top". */
export function parseNotes(text: string, offset: number): GestureCue[] {
  const out: GestureCue[] = [];
  const re = /gesture:\s*([a-z_]+)(?:\s*@\s*([\d.]+))?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text ?? "")) !== null) {
    if (!SPECS[m[1]]) continue;
    out.push({ t: offset + (m[2] ? Number(m[2]) : 0), pose: m[1], hold: 1.4 });
  }
  return out;
}

export type Beat = {
  n: number;
  motion?: string;
  visual?: string;
  emotion?: string;
};

export type Take = { n: number; start: number; words: Word[] };

/**
 * The whole episode's gesture track.
 *
 * Beats with no recorded take get nothing — an unspoken beat has no phrases to
 * hang a gesture on, and the body idles through it, which is correct.
 */
export function plan(beats: Beat[], takes: Take[]): GestureCue[] {
  const out: GestureCue[] = [];
  for (const take of takes) {
    if (!take.words?.length) continue;
    const beat = beats.find((b) => b.n === take.n);
    const written = parseNotes(
      `${beat?.motion ?? ""} ${beat?.visual ?? ""}`,
      take.start,
    );
    out.push(...planBeat(take.words, take.start, written, out));
  }
  return out.sort((a, b) => a.t - b.t);
}
