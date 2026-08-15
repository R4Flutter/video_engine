// StoryAnalyzer: what the beat is for. The director's first pass — every
// later layer reads these facts.
//
// A Short's arc is not an essay's. There is no room to orient, no room to
// reflect, and the CTA is a beat with a job rather than an afterthought. The
// positional defaults below encode the shape that actually retains:
//
//   hook → turn → explain → proof → escalate/reveal → payoff → cta
//
// An author's `Purpose:` row always wins. Everything else is inferred from
// position and language, because a heuristic that argues with the author is
// worse than no heuristic at all.
import type { NarrativePurpose, Script, ScriptBeat } from "../types.ts";
import { looksLikeQuestion, numberTokens } from "../util.ts";

export type BeatFacts = {
  n: number;
  purpose: NarrativePurpose;
  question?: string;
  reveal?: string;
  /** Claims this beat established — what the viewer knows afterwards. */
  viewerKnows: string[];
  /** Numbers this beat put on the record. Proof beats need at least one. */
  numbers: string[];
  emotionHint?: string;
};

const PURPOSE_WORDS: [RegExp, NarrativePurpose][] = [
  [/\bhook\b|\bcold open\b|\bslap\b|\bopen\b/i, "hook"],
  [/\bcta\b|\bfollow\b|\bsubscribe\b|\bcomment\b|\boutro\b|\bask\b/i, "cta"],
  [/\bpayoff\b|\bland(s|ing)?\b|\bconclusion\b|\btotal\b/i, "payoff"],
  [/\breveal\b|\bthe truth\b|\bturns out\b|\bactually\b/i, "reveal"],
  [/\bescalat|\bworse\b|\bcompound|\bevery year\b/i, "escalate"],
  [/\bproof\b|\bnumber\b|\bmath\b|\barithmetic\b|\bcheck\b|\bevidence\b/i, "proof"],
  [/\bturn\b|\bcontradict|\bbut\b|\bexcept\b|\bflip\b/i, "turn"],
  [/\bexplain|\bmechanism\b|\bhow\b|\binsight\b|\bcontext\b/i, "explain"],
];

/** The shape a Short takes when nobody says otherwise. Position is a fact:
 *  beat one hooks and the last beat asks, whatever the script calls them. */
const positional = (i: number, total: number): NarrativePurpose => {
  if (i === 0) return "hook";
  if (i === total - 1) return "cta";
  if (i === total - 2) return "payoff";
  if (i === 1) return "turn";
  const mid = (i - 2) / Math.max(1, total - 4);
  if (mid < 0.4) return "explain";
  if (mid < 0.75) return "proof";
  return "escalate";
};

export const analyzeBeat = (b: ScriptBeat, i: number, beats: ScriptBeat[]): BeatFacts => {
  let purpose: NarrativePurpose | null = null;
  if (b.purpose) {
    purpose = PURPOSE_WORDS.find(([re]) => re.test(b.purpose!))?.[1] ?? null;
  }
  if (!purpose) purpose = positional(i, beats.length);

  // A question row wins; otherwise a line that reads as a question is one.
  const question = b.question?.trim() || (looksLikeQuestion(b.vo) ? b.vo.trim() : undefined);
  const reveal = b.reveal?.trim() || undefined;

  const viewerKnows: string[] = [];
  if (b.text?.trim()) viewerKnows.push(b.text.trim());
  if (reveal) viewerKnows.push(reveal);

  return {
    n: b.n,
    purpose,
    question,
    reveal,
    viewerKnows,
    numbers: numberTokens(`${b.vo} ${b.text ?? ""}`),
    emotionHint: b.emotion,
  };
};

export const analyzeStory = (script: Script): BeatFacts[] =>
  script.beats.map((b, i) => analyzeBeat(b, i, script.beats));
