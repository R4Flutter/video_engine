// Pure geometry: vector maths, the two IK solvers, the path builders and the
// deterministic wobble. No React, no drawing — everything here is testable by
// eye with `npm run rig` and by hand with a node script.

import { RIG, STICKMAN_STYLE } from "./constants";

export type Vec = { x: number; y: number };

export const v = (x: number, y: number): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => v(a.x + b.x, a.y + b.y);
export const sub = (a: Vec, b: Vec): Vec => v(a.x - b.x, a.y - b.y);
export const scale = (a: Vec, k: number): Vec => v(a.x * k, a.y * k);
export const len = (a: Vec) => Math.hypot(a.x, a.y);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpV = (a: Vec, b: Vec, t: number): Vec =>
  v(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
export const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));
/** Normalised direction a -> b (or a safe fallback). */
export const dir = (a: Vec, b: Vec): Vec => {
  const d = sub(b, a);
  const l = len(d) || 0.001;
  return v(d.x / l, d.y / l);
};
/** Rotate a vector by `deg` degrees. */
export const rotV = (a: Vec, deg: number): Vec => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return v(a.x * c - a.y * s, a.x * s + a.y * c);
};

/**
 * Two-bone IK: given an origin and where the end should be, find the middle
 * joint (elbow or knee).
 *
 * The maths is the intersection of two circles — one of radius `upper` around
 * the origin, one of radius `fore` around the target. They meet in two points,
 * mirrored across the origin-target line, and something has to pick one.
 *
 * That pick is the entire difference between an arm and a broken arm. Picking
 * by sign — "left arm bends left" — is the obvious approach and it is wrong:
 * the sign that means *outward* flips depending on where the hand is, so an
 * arm reaching across the body suddenly folds the elbow up past the shoulder.
 * A pole vector fixes it by naming a direction the middle joint wants to be
 * in and taking whichever solution is nearer.
 *
 * The reach is clamped just short of full extension. A perfectly straight
 * limb reads as a single stick and loses its joint, and worse, the IK is
 * singular there — a target a pixel beyond reach flips the joint to the far
 * side and the limb snaps. Stopping at 0.995 keeps a visible bend at full
 * stretch.
 */
export function solveJoint(
  origin: Vec,
  target: Vec,
  pole: Vec,
  upper: number = RIG.arm.upper,
  fore: number = RIG.arm.fore,
): { middle: Vec; end: Vec } {
  const delta = sub(target, origin);
  const reach = len(delta) || 0.001;

  // Foreshortening, faked.
  //
  // A hand on the chest is 80 units from a shoulder with 300 units of arm
  // between them. In three dimensions the arm solves that by pointing some of
  // itself at the camera. Flat, it cannot, so the solver puts the whole excess
  // sideways and the elbow flies out level with the ribs — the pose that made
  // the first version of this rig look like a chicken.
  //
  // Shortening both bones as the target comes in is what animators draw
  // instead: the limb reads as angled away rather than as bent double, and the
  // joint stays where a joint goes. Only kicks in below about two thirds of
  // full reach, so every normal gesture is untouched.
  const total = upper + fore;
  const comfort = total * 0.62;
  const squash = reach < comfort ? Math.max(0.55, reach / comfort) : 1;
  const u = upper * squash;
  const f = fore * squash;

  const max = (u + f) * 0.995;
  const min = Math.abs(u - f) + 1;
  const d = clamp(reach, min, max);
  // If the target was out of reach, pull it in along the same direction rather
  // than leaving the hand detached from the wrist.
  const dvec = scale(delta, 1 / reach);
  const end = add(origin, scale(dvec, d));

  const a = (u * u - f * f + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, u * u - a * a));
  const mid = add(origin, scale(dvec, a));
  const perp = v(-dvec.y, dvec.x);

  const e1 = add(mid, scale(perp, h));
  const e2 = sub(mid, scale(perp, h));
  // Where the joint would sit if the limb could choose freely.
  const pl = len(pole) || 1;
  const hint = add(origin, scale(pole, u / pl));
  return {
    middle: len(sub(e1, hint)) <= len(sub(e2, hint)) ? e1 : e2,
    end,
  };
}

/** An arm: shoulder -> elbow -> wrist -> hand. Elbows want to be down and a
 *  little out, which is the default pole; raised gestures pass their own. */
export function solveArm(
  shoulder: Vec,
  hand: Vec,
  pole: Vec,
  upper = RIG.arm.upper,
  fore = RIG.arm.fore,
) {
  const { middle: elbow, end } = solveJoint(shoulder, hand, pole, upper, fore);
  return { elbow, hand: end };
}

/** A leg: pelvis -> knee -> ankle. Knees bend forward; the pole carries the
 *  walk direction so the knee leads the stride. */
export function solveLeg(
  pelvis: Vec,
  foot: Vec,
  pole: Vec,
  thigh = RIG.leg.thigh,
  shin = RIG.leg.shin,
) {
  const { middle: knee, end } = solveJoint(pelvis, foot, pole, thigh, shin);
  return { knee, ankle: lerpV(knee, end, 0.86), foot: end };
}

// -------------------------------------------------------------- the wobble
/** Deterministic hash -> 0..1. Same frame always draws the same line, which is
 *  what makes a distributed render match a local one. */
function hash(a: number, b: number, c: number) {
  let x = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  x = (x * 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

/**
 * The boil: the reason this looks drawn rather than tweened.
 *
 * Hand-drawn animation redraws every line every frame, and no two redraws are
 * identical, so the outline shimmers. Traditional 2D shoots that on twos or
 * threes — a new drawing every second or third frame. Jittering per-frame at
 * 30fps produces a fizz that reads as video noise instead; quantising the
 * frame first is what turns noise into ink.
 *
 * The amplitude comes from STICKMAN_STYLE.wobble so the whole character can be
 * calmed down in one place.
 */
export function boil(frame: number, seed: number, everyN = 4) {
  const amp = STICKMAN_STYLE.wobble;
  const tick = Math.floor(frame / everyN);
  return (i: number): Vec =>
    v(
      (hash(seed, tick, i * 2) - 0.5) * 2 * amp,
      (hash(seed, tick, i * 2 + 1) - 0.5) * 2 * amp,
    );
}

/**
 * A limb drawn as one continuous stroke through every joint.
 *
 * Not a string of straight lines: a real forearm carries the line of the upper
 * arm through the elbow rather than hinging off it, and a quadratic through a
 * pulled-out control point is the cheapest way to say that. Each control point
 * sits past the shared joint, away from the straight chord between neighbours,
 * so the more a limb bends the rounder its joints get.
 */
export function limbPath(
  pts: Vec[],
  jitter: (i: number) => Vec,
  i = 0,
  wobble = true,
) {
  const p = pts.map((pt, k) => {
    const j = wobble ? jitter(i + k) : v(0, 0);
    return add(pt, j);
  });
  let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let k = 0; k < p.length - 1; k += 1) {
    const a = p[k];
    const b = p[k + 1];
    // Pull the control point toward the shared joint: the bend bows toward it.
    const c = lerpV(a, b, 0.62);
    d += ` Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

/** A single wobbling stroke between two points. */
export function inkPath(a: Vec, b: Vec, jitter: (i: number) => Vec, i = 0) {
  const p0 = add(a, jitter(i));
  const p1 = add(b, jitter(i + 1));
  const mid = add(lerpV(p0, p1, 0.5), jitter(i + 2));
  return `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} Q ${mid.x.toFixed(1)} ${mid.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
}

/**
 * The head outline. Not a circle — a circle is a balloon, and the thing that
 * reads as a drawn head is an oval that is very slightly off-round, redrawn
 * every boil tick so it never settles.
 */
export function headPath(
  cx: number,
  cy: number,
  r: number,
  jitter: (i: number) => Vec,
) {
  const pts: string[] = [];
  const N = 12;
  for (let i = 0; i < N; i += 1) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const j = jitter(i + 40);
    // Slightly taller than wide, the way a head actually is.
    const px = cx + Math.cos(a) * r * 0.94 + j.x * 0.7;
    const py = cy + Math.sin(a) * r * 1.03 + j.y * 0.7;
    pts.push(`${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  // Catmull-Rom through the ring, emitted as cubics, so the outline closes
  // smoothly instead of showing 12 corners.
  let d = `M ${pts[0]}`;
  const xy = pts.map((p) => p.split(" ").map(Number) as [number, number]);
  for (let i = 0; i < N; i += 1) {
    const p0 = xy[(i - 1 + N) % N];
    const p1 = xy[i];
    const p2 = xy[(i + 1) % N];
    const p3 = xy[(i + 2) % N];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}
