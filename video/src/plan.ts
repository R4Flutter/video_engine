// The renderer's view of the director plan.
//
// The plan is a build artifact: `npm run script` writes script.json, then
// `npm run direct` writes director-plan.json beside it. Both are committed so
// the bundle never depends on a step having been run.
//
// Everything here is defensive. A plan field that is missing falls back to
// what the composition did before the director existed — a script that
// predates all of this still renders exactly as it always did.
import planJson from "./director-plan.json";

type PlanDocument = {
  project?: { title?: string; durationInSeconds?: number; fps?: number; engine?: string };
  frameZero?: { text?: string; holdFrames?: number; words?: number; size?: string };
  audioEvents?: { kind?: string; at?: number; value?: number | string }[];
  beats?: {
    n: number;
    start?: number;
    narrative?: { purpose?: string };
    motion?: { camera?: { intent?: string } };
    audio?: {
      silence?: { at: number; dur: number }[];
      sfx?: { at: number; files: string[] }[];
    };
  }[];
};

const plan = planJson as unknown as PlanDocument;

export type PlanBeat = (NonNullable<typeof plan.beats>)[number];

export const PLAN = plan;
export const FPS = plan.project?.fps ?? 30;

/** The frame-zero contract. This is the whole reason the director exists:
 *  the complete hook, legible on frame one, held still long enough to read. */
export const HOOK = {
  text: plan.frameZero?.text ?? "",
  holdFrames: plan.frameZero?.holdFrames ?? 0,
  /** How many spoken words the card's text accounts for. The card and the
   *  kinetic beat underneath must agree on this or they both say the claim. */
  words: plan.frameZero?.words ?? 0,
  size: plan.frameZero?.size ?? "max",
  engine: plan.project?.engine ?? "finance",
};

const BY_N: Record<number, PlanBeat> = Object.fromEntries(
  (plan.beats ?? []).map((b) => [b.n, b]),
);

export const beatPlan = (n: number): PlanBeat | undefined => BY_N[n];

/** Scale pairs per camera intent, per engine. The director names the intent;
 *  the amount of move is a rendering decision and belongs here.
 *
 *  A page drifts. A stage punches. Neither of them moves on beat one. */
const MOVE: Record<string, Record<string, [number, number]>> = {
  finance: {
    hold: [1, 1],
    settle: [1.0, 1.02],
    push: [1.0, 1.07],
    pull: [1.07, 1.0],
    punch: [1.12, 1.0],
  },
  vox: {
    hold: [1, 1],
    settle: [1.0, 1.012],
    push: [1.0, 1.03],
    pull: [1.03, 1.0],
    punch: [1.05, 1.0],
  },
};

/** The camera move for a beat, as a [from, to] scale pair. */
export const cameraMove = (n: number): [number, number] => {
  const b = beatPlan(n);
  const table = MOVE[HOOK.engine] ?? MOVE.finance;
  return table[b?.motion?.camera?.intent ?? "settle"] ?? [1, 1];
};

/** The music bed level at time t, from the plan's level events. Piecewise
 *  constant with the silence windows carved out — the director decided where
 *  the bed steps aside, and the renderer just obeys. */
export const bedLevel = (t: number): number => {
  const events = plan.audioEvents ?? [];
  let level = 0.4;
  for (const e of events) {
    if (e.kind === "music_level" && typeof e.at === "number" && e.at <= t && typeof e.value === "number") level = e.value;
  }
  for (const b of plan.beats ?? []) {
    for (const s of b.audio?.silence ?? []) {
      if (t >= s.at && t < s.at + s.dur) {
        // A named silence window is a duck, not a mute: the bed drops to a
        // floor rather than cutting, because a hard cut in a 30s piece is
        // audible as a dropout.
        return Math.min(level, 0.06);
      }
    }
  }
  return level;
};

/** Every sfx cue the director scheduled, flattened. The director's per-beat
 *  audio.sfx may be a plain NAME (e.g. "stamp", consumed by scene staging) —
 *  only array-shaped cue schedules contribute here, and staging falls back to
 *  script.sfx when none exist. */
export const SFX_CUES = (plan.beats ?? []).flatMap((b) =>
  Array.isArray(b.audio?.sfx)
    ? (b.audio.sfx as { at: number; files: string[] }[]).map((cue) => ({ at: cue.at, files: cue.files }))
    : [],
);

/** The beat the plan wants the bed to swell into — the payoff. Used by the
 *  existing Soundtrack's impact parameter. */
export const IMPACT_AT = (() => {
  const payoff = (plan.beats ?? []).find((b) => b.narrative?.purpose === "payoff");
  const last = (plan.beats ?? [])[(plan.beats ?? []).length - 1];
  return payoff?.start ?? last?.start ?? 0;
})();
