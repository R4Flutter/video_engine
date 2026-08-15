// LoopPlanner: does the ending rhyme with the opening?
//
// This replaces the essay engine's callback system, which existed to make a
// ten-minute film feel like one film. A Short has a different and more
// mercenary reason to care: a Short whose last frame flows into its first
// gets watched twice, and rewatch is counted. It is the only retention gain
// available *after* the video is over.
//
// Two things are checked. `closes` — the final beat restates the motif the
// hook planted, so the loop is intellectually shut. `seamless` — the final
// frame could cut to the first without a jolt, so the loop is visually shut.
import type { LoopPlan, ScriptBeat } from "../types.ts";
import { numberTokens, overlap, slug, words } from "../util.ts";

/** The motif the hook plants: its most distinctive number, else its most
 *  distinctive phrase. This is the thing the ending has to bring back. */
export const motifOf = (hook: ScriptBeat): string => {
  const nums = numberTokens(`${hook.text ?? ""} ${hook.vo}`);
  if (nums.length && nums[0]) return nums[0];
  const source = (hook.text?.trim() || hook.vo).replace(/\s+/g, " ");
  // Content words only. Length alone is not enough of a filter — "your" and
  // "isn't" are long and carry nothing, and a motif made of them is not
  // something a viewer can recognise when it returns.
  const STOP =
    /^(your|yours|you|the|a|an|and|but|is|isn'?t|are|aren'?t|not|this|that|with|from|for|its|it'?s|was|were|has|have|been|will|would|can|just|only|more|most|than|then|them|they|here|there|what|when|how)$/i;
  const content = words(source).filter((w) => w.length > 3 && !STOP.test(w.replace(/[^\w']/g, "")));
  return content.slice(0, 3).join(" ") || source.slice(0, 24);
};

export const planLoop = (beats: ScriptBeat[]): LoopPlan => {
  const hook = beats[0];
  const last = beats[beats.length - 1];
  if (!hook || !last) {
    return { motif: "", openedAtBeat: 0, closedAtBeat: null, closes: false, seamless: false };
  }

  const motif = motifOf(hook);
  const key = slug(motif);

  // Which beat brings the motif back? Search from the end — a callback in the
  // middle is a repeat, a callback at the end is a loop.
  let closedAtBeat: number | null = null;
  for (let i = beats.length - 1; i >= 1; i--) {
    const b = beats[i];
    const hay = `${b.vo} ${b.text ?? ""}`;
    if (slug(hay).includes(key) || overlap(motif, hay) >= 0.6) {
      closedAtBeat = b.n;
      break;
    }
  }

  // The loop closes when the motif returns in the final third.
  const lateThreshold = beats[Math.max(0, Math.floor(beats.length * 0.66))].n;
  const closes = closedAtBeat !== null && closedAtBeat >= lateThreshold;

  // Seamless: the last frame and the first frame say something close enough
  // that a rewatch reads as continuous rather than as a restart.
  const seamless =
    overlap(hook.text ?? hook.vo, last.text ?? last.vo) >= 0.35 ||
    (last.loop ? true : false);

  return {
    motif,
    openedAtBeat: hook.n,
    closedAtBeat,
    closes,
    seamless,
  };
};
