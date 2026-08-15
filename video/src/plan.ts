// The renderer's view of the director plan.
// Plan data is the editorial source of truth; this file translates semantic
// intent into safe rendering defaults.
import plan from "./director-plan.json";

export type PlanBeat = (typeof plan.beats)[number];
export const PLAN = plan;
export const FPS = plan.project?.fps ?? 30;

export const HOOK = {
  text: plan.frameZero?.text ?? "",
  holdFrames: plan.frameZero?.holdFrames ?? 0,
  words: plan.frameZero?.words ?? 0,
  size: plan.frameZero?.size ?? "max",
  engine: plan.project?.engine ?? "finance",
};

const BY_N: Record<number, PlanBeat> = Object.fromEntries((plan.beats ?? []).map((b) => [b.n, b]));
export const beatPlan = (n:number): PlanBeat | undefined => BY_N[n];

/** Safe scale ranges. The new camera grammar keeps moves below ~5% during
 * explanatory shots and uses a short punch instead of a giant zoom. */
const MOVE: Record<string, Record<string, [number,number]>> = {
  finance: {
    hold: [1,1],
    settle: [1.0,1.018],
    push: [1.0,1.045],
    pull: [1.045,1.0],
    punch: [1.0,1.06],
  },
  vox: {
    hold: [1,1],
    settle: [1.0,1.012],
    push: [1.0,1.03],
    pull: [1.03,1.0],
    punch: [1.0,1.05],
  },
};

export const cameraMove = (n:number): [number,number] => {
  const b = beatPlan(n);
  const table = MOVE[HOOK.engine] ?? MOVE.finance;
  return table[b?.motion?.camera?.intent ?? "settle"] ?? [1,1];
};

export const bedLevel = (t:number): number => {
  const events = plan.audioEvents ?? [];
  let level = 0.4;
  for (const e of events) if (e.kind === "music_level" && e.at <= t && typeof e.value === "number") level = e.value;
  for (const b of plan.beats ?? []) for (const s of b.audio?.silence ?? []) {
    if (t >= s.at && t < s.at + s.dur) return Math.min(level,0.06);
  }
  return level;
};

export const SFX_CUES = (plan.beats ?? []).flatMap((b) => (b.audio?.sfx ?? []).map((cue) => ({ at:cue.at, files:cue.files })));
export const IMPACT_AT = (() => {
  const payoff = (plan.beats ?? []).find((b) => b.narrative?.purpose === "payoff");
  const last = (plan.beats ?? [])[(plan.beats ?? []).length-1];
  return payoff?.start ?? last?.start ?? 0;
})();
