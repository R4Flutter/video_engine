// The behaviours: time-based motion layered over a pose. A pose says where the
// body is; a behaviour says how it moves — walking cycles the legs, talking
// rides the speech envelope, reacting recoils and settles.
//
// Every behaviour is a pure function of (spec, t): same frame, same body, so
// distributed renders stay identical. Nothing here stores state.

import type { AnimationName, PoseSpec } from "./types";
import { easeOutCubic, loop01, recoil } from "./motion";
import { v } from "./geometry";
import { RIG } from "./constants";

export type AnimContext = {
  /** Seconds on the episode timeline. */
  t: number;
  fps: number;
  /** Speech loudness at this instant, 0..1. 0 when not speaking. */
  energy: number;
  speaking: boolean;
};

const smooth = (x: number, a: number, b: number) =>
  Math.max(0, Math.min(1, (x - a) / (b - a)));

/**
 * The idle layer: breathing, sway and a micro head wobble, three oscillators
 * at unrelated periods. Related periods beat against each other and the body
 * visibly pulses; unrelated ones never repeat inside a 40-second video, which
 * is the whole trick. Applied on top of every held pose.
 */
export function animIdle(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t } = ctx;
  return {
    ...spec,
    lean: (spec.lean ?? 0) + Math.sin(t * 0.62) * 5,
    rise: (spec.rise ?? 0) + Math.sin(t * 1.55) * 3.4,
    tilt:
      (spec.tilt ?? 0) + Math.sin(t * 0.47 + 1.1) * 2.2 + Math.sin(t * 0.9) * 1.2,
  };
}

/**
 * The talking layer: what a body does while the voice is going.
 *
 * The head bob rides the loudness envelope (done in buildPose via `bob`), so
 * here it is only the small stuff: a tiny torso lift with each stressed word,
 * a gentle asymmetry in the hands, an occasional brow pulse. When the voice is
 * silent but the scene says "talking" anyway, it falls back to a slow
 * period — hands lifting alternately, like a person rehearsing aloud.
 */
export function animTalking(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t, energy, speaking } = ctx;
  if (speaking && energy > 0) {
    return {
      ...spec,
      rise: (spec.rise ?? 0) - energy * 2,
      handL: v(
        spec.handL.x - Math.sin(t * 2.3) * 3 * energy,
        spec.handL.y + Math.sin(t * 1.9) * 2 * energy,
      ),
      handR: v(
        spec.handR.x + Math.sin(t * 2.3 + 1) * 3 * energy,
        spec.handR.y - Math.sin(t * 2.1) * 2 * energy,
      ),
      brow: (spec.brow ?? 0) + Math.sin(t * 3.1) * 0.08 * energy,
    };
  }
  return {
    ...spec,
    turn: (spec.turn ?? 0) + Math.sin(t * 0.9) * 1.6,
    handL: v(spec.handL.x, spec.handL.y - Math.max(0, Math.sin(t * 1.7)) * 7),
    handR: v(
      spec.handR.x,
      spec.handR.y - Math.max(0, Math.sin(t * 1.7 + Math.PI)) * 7,
    ),
  };
}

/** One stride cycle. Feet alternate fore and aft, lifting off the ground on
 *  the swing, arms swing opposite, the body bounces once per step. */
function stride(
  spec: PoseSpec,
  ctx: AnimContext,
  period: number,
  strideAmt: number,
  lift: number,
): PoseSpec {
  const { t } = ctx;
  const ph = loop01(t, period) * Math.PI * 2;
  const sway = Math.sin(ph);
  const bounce = (0.5 - Math.cos(ph) * 0.5) * 5;
  return {
    ...spec,
    lean: (spec.lean ?? 0) + (period > 0.6 ? 3 : 9),
    rise: (spec.rise ?? 0) + bounce,
    tilt: (spec.tilt ?? 0) + Math.sin(ph) * 1.2,
    footL: v(RIG.hip.x - 30 + sway * strideAmt, RIG.ground - Math.max(0, Math.sin(ph)) * lift),
    footR: v(RIG.hip.x + 30 - sway * strideAmt, RIG.ground - Math.max(0, -Math.sin(ph)) * lift),
    kneePoleL: v(Math.cos(ph) * 0.35, 1),
    kneePoleR: v(-Math.cos(ph) * 0.35, 1),
    handL: v(spec.handL.x - sway * strideAmt * 0.7, spec.handL.y + Math.sin(ph) * 4),
    handR: v(spec.handR.x + sway * strideAmt * 0.7, spec.handR.y - Math.sin(ph) * 4),
  };
}

export function animWalking(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  return stride(spec, ctx, 0.74, 42, 30);
}

export function animRunning(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  return stride(spec, ctx, 0.5, 72, 52);
}

/** A wave: the raised hand sweeps in an arc, the head tilts in. */
export function animWaving(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t } = ctx;
  return {
    ...spec,
    handR: v(spec.handR.x + Math.sin(t * 6) * 8, spec.handR.y - Math.sin(t * 6) * 26),
    tilt: (spec.tilt ?? 0) + 6 + Math.sin(t * 6) * 2,
  };
}

/** A nod: the head dips and recovers. */
export function animNodding(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t } = ctx;
  return {
    ...spec,
    headDip: Math.max(0, Math.sin(t * 3.6)) * 7,
  };
}

/** Shaking the head: lateral head sweep and a hint of body sway. */
export function animShaking(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t } = ctx;
  return {
    ...spec,
    turn: (spec.turn ?? 0) + Math.sin(t * 5.5) * 7,
    tilt: (spec.tilt ?? 0) + Math.sin(t * 5.5) * 1.5,
  };
}

/**
 * A jump, looped: anticipation (crouch), launch, apex, land with a settle
 * bounce. One full cycle every 1.5s.
 */
export function animJumping(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t } = ctx;
  const ph = loop01(t, 1.5);
  const crouch = smooth(ph, 0, 0.22);
  const launch = smooth(ph, 0.22, 0.5);
  const descend = smooth(ph, 0.55, 0.8);
  const land = smooth(ph, 0.82, 1);

  const up = easeOutCubic(launch) * 150;
  const down = easeOutCubic(descend) * 150;
  const height = up - down;
  const squat = crouch * 22 * (1 - launch);
  const tuck = launch * 40 * (1 - descend) + 40 * (1 - land) * 0.6;

  return {
    ...spec,
    rise: (spec.rise ?? 0) - height + squat * 0.4,
    pelvisDrop: 0,
    kneeL: v(258, 545 + 120 + tuck * 0.4),
    kneeR: v(362, 545 + 120 + tuck * 0.4),
    footL: v(272, 760 + height * 0.4 + squat),
    footR: v(348, 760 + height * 0.4 + squat),
    tilt: (spec.tilt ?? 0) + Math.sin(ph * Math.PI * 2) * 2,
  };
}

/**
 * A fall, one pass: the body rotates back about the pelvis and stays down.
 * Give it a fresh `t` (e.g. t minus the scene start) so the fall lands on cue.
 */
export function animFalling(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t } = ctx;
  const roll = easeOutCubic(smooth(t, 0, 0.55)) * 72;
  const settle = easeOutCubic(smooth(t, 0.55, 0.85)) * 6;
  return {
    ...spec,
    roll: (spec.roll ?? 0) + roll,
    rise: (spec.rise ?? 0) + settle,
    handL: v(spec.handL.x, spec.handL.y - roll * 0.5),
    handR: v(spec.handR.x, spec.handR.y - roll * 0.5),
  };
}

/** Celebrating: a bounce on the beat, a sway, a head toss. */
export function animCelebrating(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t } = ctx;
  const bounce = Math.abs(Math.sin(t * Math.PI * 2.2)) * 16;
  return {
    ...spec,
    rise: (spec.rise ?? 0) - bounce,
    tilt: (spec.tilt ?? 0) + Math.sin(t * Math.PI * 2.2) * 3,
    turn: (spec.turn ?? 0) + Math.sin(t * 1.7) * 3,
  };
}

/** Reacting: a sharp recoil, an overshoot, and a settle. Use `t` relative to
 *  the moment of impact. */
export function animReacting(spec: PoseSpec, ctx: AnimContext): PoseSpec {
  const { t } = ctx;
  const r = recoil(t, 1);
  return {
    ...spec,
    lean: (spec.lean ?? 0) - r * 9,
    rise: (spec.rise ?? 0) - r * 7,
    handL: v(spec.handL.x - r * 6, spec.handL.y - r * 10),
    handR: v(spec.handR.x + r * 6, spec.handR.y - r * 10),
    tilt: (spec.tilt ?? 0) + r * 4,
  };
}

export const ANIMATIONS: Record<AnimationName, (s: PoseSpec, c: AnimContext) => PoseSpec> = {
  idle: animIdle,
  talking: animTalking,
  walking: animWalking,
  running: animRunning,
  waving: animWaving,
  nodding: animNodding,
  shaking: animShaking,
  jumping: animJumping,
  falling: animFalling,
  celebrating: animCelebrating,
  reacting: animReacting,
};
