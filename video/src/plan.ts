// Renderer-facing camera plan helpers. The director emits semantic camera
// intents; this file turns them into engine-specific scale pairs.
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
export const beatPlan = (n: number): PlanBeat | undefined => BY_N[n];

const MOVE: Record<string, Record<string, [number, number]>> = {
  finance: {
    hold: [1, 1], settle: [1.0, 1.02], push: [1.0, 1.07], pull: [1.07, 1.0], punch: [1.12, 1.0],
  },
  longform: {
    hold: [1, 1], settle: [1.0, 1.008], push: [1.0, 1.025], pull: [1.025, 1.0], punch: [1.04, 1.0],
  },
};

export const cameraMove = (n: number): [number, number] => {
  const b = beatPlan(n);
  const table = MOVE[b?.motion?.camera?.intent ? (b.motion.camera.intent === "hold" ? (b.project?.engine ?? "longform") : (b.project?.engine ?? "longform")) : "longform"] ?? MOVE.longform;
  return table[b?.motion?.camera?.intent ?? "settle"] ?? [1, 1];
};

export const bedLevel = (t: number): number => {
  const events = plan.audioEvents ?? [];
  let level = 0.4;
  for (const e of events) {
    if (e.kind === "music_level" && e.at <= t && typeof e.value === "number") level = e.value;
  }
  for (const b of plan.beats ?? []) {
    for (const s of b.audio?.silence ?? []) {
      if (t >= s.at && t < s.at + s.dur) return Math.min(level, 0.06);
    }
  }
  return level;
};

export const SFX_CUES = (plan.beats ?? []).flatMap((b) => (b.audio?.sfx ?? []).map((cue) => ({ at: cue.at, files: cue.files })));

export const IMPACT_AT = (() => {
  const payoff = (plan.beats ?? []).find((b) => b.narrative?.purpose === "payoff");
  const last = (plan.beats ?? [])[(plan.beats ?? []).length - 1];
  return payoff?.start ?? last?.start ?? 0;
})();
