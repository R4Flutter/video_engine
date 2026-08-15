// CuriosityEngine: the open loop.
//
// A viewer stays for an answer they are waiting for. So the rule a Short
// lives by is: never be in a state where nothing is unresolved. The hook
// opens a loop; every beat either holds it open, closes it and opens the
// next, or — the failure case — leaves the viewer with nothing pending and
// no reason to give the video another second.
//
// This walks the beats and reports, per beat, whether a loop is open. The
// swipe model reads that array directly, and it is one of the largest terms
// in it.
import type { Script } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import { looksLikeQuestion } from "../util.ts";

export type CuriosityState = {
  /** Per beat index: was a question open while this beat played? */
  openLoop: boolean[];
  /** Beat indices where a loop opened. */
  opened: number[];
  /** Beat indices where a loop closed. */
  closed: number[];
  /** Questions still open when the video ends. */
  unresolved: { question: string; atBeat: number }[];
  /** The longest run of beats with nothing pending. */
  longestFlatRun: { from: number; to: number; seconds: number } | null;
};

/** A beat opens a loop when it asks something, promises something, or states
 *  a contradiction that demands a mechanism. The third case is the one
 *  authors forget: "your paycheck isn't the problem" is a question. */
const opensLoop = (f: BeatFacts, vo: string) =>
  Boolean(f.question) ||
  looksLikeQuestion(vo) ||
  f.purpose === "hook" ||
  f.purpose === "turn" ||
  /\b(here'?s why|the reason|watch|but|isn'?t|not the|until you)\b/i.test(vo);

/** A beat closes a loop when it reveals, proves, or pays off. */
const closesLoop = (f: BeatFacts) =>
  Boolean(f.reveal) || f.purpose === "reveal" || f.purpose === "payoff" || f.purpose === "proof";

export const runCuriosity = (script: Script, facts: BeatFacts[]): CuriosityState => {
  const beats = script.beats;
  const openLoop: boolean[] = [];
  const opened: number[] = [];
  const closed: number[] = [];
  let open: { question: string; atBeat: number } | null = null;

  for (let i = 0; i < facts.length; i++) {
    const f = facts[i];
    const b = beats[i];

    if (opensLoop(f, b.vo)) {
      open = { question: f.question ?? b.vo.trim(), atBeat: b.n };
      opened.push(i);
    }
    // The loop is open *during* this beat if it was open coming in, or this
    // beat opened one. A beat that both closes and opens keeps the chain
    // unbroken — that is the ideal shape.
    openLoop.push(Boolean(open));

    if (closesLoop(f)) {
      if (open) closed.push(i);
      // The CTA is the only place a Short is allowed to have nothing pending.
      if (!opensLoop(f, b.vo)) open = null;
    }
  }

  // The longest stretch with nothing pending — the place a viewer is most
  // likely to decide they have got the point and leave.
  let longest: CuriosityState["longestFlatRun"] = null;
  let runStart = -1;
  for (let i = 0; i <= openLoop.length; i++) {
    const flat = i < openLoop.length && !openLoop[i];
    if (flat && runStart < 0) runStart = i;
    if (!flat && runStart >= 0) {
      const seconds = beats[i - 1].end - beats[runStart].start;
      if (!longest || seconds > longest.seconds) {
        longest = { from: beats[runStart].n, to: beats[i - 1].n, seconds: Number(seconds.toFixed(2)) };
      }
      runStart = -1;
    }
  }

  return {
    openLoop,
    opened,
    closed,
    unresolved: open && facts[facts.length - 1]?.purpose !== "cta" ? [open] : [],
    longestFlatRun: longest,
  };
};
