// RevealPlanner: progressive disclosure as an explicit trigger schedule.
//
//   hold      nothing moves (a held frame is a choice, not a pause)
//   accent    a mark, a stamp or a hit lands
//   question  the open loop is stated on screen
//   reveal    the thing is revealed: stamp + camera punch + music drop
//
// Triggers are deterministic and beat-relative, so a re-run of the director
// produces the same edit.
//
// Shorts difference: `holdUntil` on beat one is the frame-zero hold, and it
// is the only place in the video where holding is mandatory rather than
// earned.
import type { RevealMode, RevealTrigger, ScriptBeat } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import { rng, round2, type Rng } from "../util.ts";

export type RevealDecision = { mode: RevealMode; holdUntil: number; triggers: RevealTrigger[] };

export const revealFor = (
  b: ScriptBeat,
  facts: BeatFacts,
  mode: RevealMode,
  strategy: string,
  isFirst: boolean,
  frameZeroHoldSeconds: number,
): RevealDecision => {
  const dur = Math.max(0.2, b.end - b.start);
  const r: Rng = rng(b.n * 104729 + 3);

  // Beat one: the complete hook is held, then anything else may run under it.
  const holdUntil = isFirst
    ? round2(b.start + frameZeroHoldSeconds)
    : round2(b.start + dur * (strategy === "progressive" ? 0.08 : 0.03));

  const triggers: RevealTrigger[] = [];

  if (isFirst) {
    triggers.push({ at: round2(b.start), kind: "hold", label: "frame zero — complete hook, no motion" });
  }
  if (facts.question && !isFirst) {
    triggers.push({
      at: round2(b.start + dur * (0.12 + r() * 0.08)),
      kind: "question",
      label: facts.question.slice(0, 40),
    });
  }
  if (facts.reveal) {
    // The reveal lands late and keeps the beat's remaining air.
    triggers.push({
      at: round2(b.start + dur * (0.6 + r() * 0.15)),
      kind: "reveal",
      label: facts.reveal.slice(0, 40),
    });
  }
  // Any beat over four seconds earns at least one accent, or it is a static
  // card held too long — the single most common Shorts retention leak.
  if (dur >= 4 && !facts.reveal) {
    triggers.push({ at: round2(b.start + dur * (0.42 + r() * 0.16)), kind: "accent" });
  }

  return { mode, holdUntil, triggers: triggers.sort((a, z) => a.at - z.at) };
};
