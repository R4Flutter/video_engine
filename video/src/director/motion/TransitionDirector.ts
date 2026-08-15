// TransitionDirector: every transition earns its reason.
//
// A cut is the default and it is also the best transition more often than any
// effect is. In a Short it is even more true — a half-second wipe is 2% of
// the video spent on nothing. Motivated transitions only:
//
//   a contradiction lands        → punch (the frame hits, the idea flips)
//   the same subject continues   → page (the eye is carried)
//   the payoff                   → punch
//   the loop closes              → hold (the last frame settles into the first)
//   everything else              → cut
import type {
  Emotion,
  ScriptBeat,
  TransitionReason,
  TransitionType,
} from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";

export type TransitionDecision = { type: TransitionType; reason: TransitionReason; frames: number };

const PAGE_FRAMES = 6; // 0.2s at 30fps — reads as paper moving, not a wipe
const PUNCH_FRAMES = 3;
const HOLD_FRAMES = 9;

export const transitionInto = (
  b: ScriptBeat,
  prev: ScriptBeat | undefined,
  facts: BeatFacts,
  emotion: Emotion,
  sameModule: boolean,
  isLast: boolean,
): TransitionDecision => {
  if (!prev) return { type: "cut", reason: "NEW_IDEA", frames: 0 };
  if (isLast) return { type: "hold", reason: "LOOP_CLOSE", frames: HOLD_FRAMES };
  if (facts.purpose === "payoff" || facts.purpose === "reveal")
    return { type: "punch", reason: "IMPACT", frames: PUNCH_FRAMES };
  if (facts.purpose === "turn" || emotion === "surprise")
    return { type: "punch", reason: "CONTRADICTION", frames: PUNCH_FRAMES };
  if (sameModule) return { type: "page", reason: "SAME_SUBJECT", frames: PAGE_FRAMES };
  return { type: "cut", reason: "NEW_IDEA", frames: 0 };
};
