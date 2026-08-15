// The pose library: authored specs compiled into full joint data.
//
// Every pose is authored as a small spec — where the hands go, how the body
// carries them — and compiled once at module load into a complete StickmanPose
// with every joint resolved by the IK solvers. Scenes never move joints
// directly; they name a pose, and the rig produces the body.

import { RIG, UNIT } from "./constants";
import type { Vec } from "./geometry";
import { add, lerpV, solveArm, solveJoint, v } from "./geometry";
import type { GestureCue, PoseSpec, StickmanPose } from "./types";

/** Fallbacks applied to every pose before it is compiled. */
const DEFAULTS: Required<
  Pick<
    PoseSpec,
    | "tilt" | "turn" | "lean" | "rise" | "roll" | "stance"
    | "brow" | "eyes" | "bob" | "snap" | "handLType" | "handRType"
  >
> = {
  tilt: 0, turn: 0, lean: 0, rise: 0, roll: 0, stance: 0,
  brow: 0, eyes: 1, bob: 5, snap: 1,
  handLType: "fist", handRType: "fist",
};

export const DEFAULT_POSE: PoseSpec = { handL: v(218, 530), handR: v(402, 524) };

/**
 * Compile a spec into a full skeleton.
 *
 * The spine transforms are authored as lean/rise/turn and applied to the
 * neutral skeleton; the arms and legs are IK-solved around the hand and foot
 * targets; the wrist and ankle are derived points on their bones so the
 * renderer can show four-joint limbs.
 *
 * `energy` (the speech envelope, 0..1) rides the head so speech and head
 * motion stay in sync for free.
 */
export function buildPose(spec: PoseSpec, energy = 0): StickmanPose {
  const s = { ...DEFAULTS, ...spec };
  const bob = s.bob * energy;

  const drop = s.pelvisDrop ?? 0;
  const pelvis = v(RIG.hip.x + s.lean * 0.25, RIG.hip.y + drop + s.rise * 0.2);
  const chest = v(RIG.hip.x + s.lean * 0.8, RIG.chest.y + drop + s.rise);
  const neck = v(RIG.hip.x + s.lean, RIG.neck.y + drop + s.rise - bob * 0.3);
  const head = v(
    RIG.hip.x + s.lean * 1.25 + s.turn * 1.4,
    RIG.head.y + drop + s.rise - bob + (s.headDip ?? 0),
  );

  const shL = v(chest.x - RIG.shoulderSpan, chest.y);
  const shR = v(chest.x + RIG.shoulderSpan, chest.y);

  // Hands ride the pelvis so they stay attached to the body: authored hand
  // positions are relative to the neutral standing skeleton, and any body
  // shift (lean, rise, drop) carries them along. Without this a seated pose
  // would need hands unreachably far from the shoulders.
  const handL = add(s.handL, v(s.lean * 0.25, drop + s.rise * 0.2));
  const handR = add(s.handR, v(s.lean * 0.25, drop + s.rise * 0.2));

  const armL = solveArm(shL, handL, s.poleL ?? v(-0.42, 0.91));
  const armR = solveArm(shR, handR, s.poleR ?? v(0.42, 0.91));
  // The wrist sits a hand-length short of the hand on the forearm line.
  const wristL = lerpV(armL.elbow, armL.hand, 0.84);
  const wristR = lerpV(armR.elbow, armR.hand, 0.84);

  const stance = s.stance;
  const footL = s.footL ?? v(RIG.hip.x - 46 - stance * 0.5, RIG.ground);
  const footR = s.footR ?? v(RIG.hip.x + 46 + stance * 0.5, RIG.ground);

  const solveLeg = (foot: Vec, kneePole: Vec): { knee: Vec; foot: Vec } => {
    const r = solveJoint(pelvis, foot, kneePole, RIG.leg.thigh, RIG.leg.shin);
    return { knee: r.middle, foot: r.end };
  };
  const legL = s.kneeL ? { knee: s.kneeL, foot: footL } : solveLeg(footL, s.kneePoleL ?? v(-0.2, 1));
  const legR = s.kneeR ? { knee: s.kneeR, foot: footR } : solveLeg(footR, s.kneePoleR ?? v(0.2, 1));

  const ankleL = lerpV(legL.knee, legL.foot, 0.86);
  const ankleR = lerpV(legR.knee, legR.foot, 0.86);

  return {
    head, neck,
    leftShoulder: shL, leftElbow: armL.elbow, leftWrist: wristL, leftHand: armL.hand,
    rightShoulder: shR, rightElbow: armR.elbow, rightWrist: wristR, rightHand: armR.hand,
    pelvis,
    leftKnee: legL.knee, leftAnkle: ankleL, leftFoot: legL.foot,
    rightKnee: legR.knee, rightAnkle: ankleR, rightFoot: legR.foot,
    tilt: s.tilt, turn: s.turn, roll: s.roll,
  };
}

// ------------------------------------------------------------------ poses
//
// Coordinates are absolute rig positions. The numbers that matter:
//
//   shoulders   (230, 245) and (390, 245)
//   arm reach   300 — a hand further than that from its shoulder is clamped
//   head        centre (310, 105), radius 75, so the head spans y 30–180
//   pelvis      (310, 539); the ground is y 890
//
// The authored record keeps `handL: v(...), handR: v(...)` on one line — the
// tooling in tools/rig.mjs reads the pose table by regex, and a pose that
// cannot be checked is a pose that ships broken.

const SPECS: Record<string, PoseSpec> = {
  /** Arms down. Not quite symmetrical — a body at perfect rest is a mannequin. */
  idle: {
    handL: v(218, 530), handR: v(402, 524),
    snap: 0.7,
  },

  /** The neutral standing figure. */
  standing: {
    handL: v(216, 528), handR: v(404, 528),
    snap: 0.8,
  },

  /** The default while speaking: hands lifted off the body, loose, waist-high.
   *  This is where a person's hands live when they are explaining something,
   *  and returning here between gestures is what makes the others read as
   *  gestures rather than as flailing. */
  talk: {
    handL: v(206, 400), handR: v(414, 394),
    handLType: "open", handRType: "open",
    brow: 0.1, snap: 1,
  },

  /** A mid-stride hold; the walking behaviour adds the cycle. */
  walking: {
    handL: v(188, 400), handR: v(432, 336),
    handLType: "fist", handRType: "fist",
    lean: 4, stance: 6, snap: 1.4,
  },

  /** Leaned into the run, fists up, stride wide. */
  running: {
    handL: v(150, 430), handR: v(470, 300),
    lean: 14, stance: 14, snap: 1.6,
  },

  /** Arm out to screen left. For the chart on the left, or a comparison. */
  point_left: {
    handL: v(66, 268), handR: v(402, 530),
    handLType: "point", handRType: "fist",
    tilt: -3, turn: -8, lean: -8, brow: 0.4, eyes: 1.1, snap: 1.4,
  },

  /** Arm out to screen right, at whatever the frame is showing. */
  point_right: {
    handL: v(218, 532), handR: v(556, 268),
    handLType: "fist", handRType: "point",
    tilt: 4, turn: 8, lean: 8, brow: 0.4, eyes: 1.1, snap: 1.4,
  },

  /** Arm straight up. For a claim, a first item, a "here's the thing". */
  point_up: {
    handL: v(218, 530), handR: v(474, 14),
    handLType: "fist", handRType: "point",
    tilt: -4, turn: -3, brow: 0.5, eyes: 1.1, snap: 1.5,
  },

  /** Arm down at the chart. The "look at this" of the finance idiom. */
  point_down: {
    handL: v(216, 528), handR: v(396, 470),
    handLType: "fist", handRType: "point",
    tilt: 6, turn: 5, brow: 0.3, snap: 1.3,
  },

  /** Both arms folded across the chest. The holding position of a skeptic. */
  arms_crossed: {
    handL: v(336, 344), handR: v(284, 344),
    poleL: v(-0.62, 0.78), poleR: v(0.62, 0.78),
    tilt: -2, stance: 4, snap: 1.2,
  },

  /** Thumbs on hips, elbows out. The "we've got this" stance. */
  hands_on_hips: {
    handL: v(264, 500), handR: v(356, 500),
    poleL: v(-0.75, 0.66), poleR: v(0.75, 0.66),
    handLType: "thumbsUp", handRType: "thumbsUp",
    tilt: 2, stance: 4, snap: 1.1,
  },

  /** Hand up beside the chin, elbow resting low. The pensive pause. */
  thinking: {
    handL: v(216, 528), handR: v(374, 222),
    handLType: "fist", handRType: "open",
    poleR: v(0.42, 0.9),
    tilt: -4, snap: 1.3,
  },

  /** Both hands open in the gesture space, one higher than the other. The
   *  default "let me walk you through this" frame. */
  explaining: {
    handL: v(184, 396), handR: v(434, 340),
    handLType: "open", handRType: "open",
    brow: 0.15, snap: 1.2,
  },

  /** Hands cupped in front, low. For the money, the jar, the amount. */
  holding_money: {
    handL: v(284, 498), handR: v(336, 498),
    handLType: "hold", handRType: "hold",
    tilt: 3, lean: 4, snap: 0.9,
  },

  /** Leaned into the chart, pointing at it, eyes following. */
  looking_at_chart: {
    handL: v(204, 470), handR: v(408, 470),
    handLType: "fist", handRType: "point",
    tilt: -16, turn: -10, lean: 12, snap: 1.2,
  },

  /** Both arms up, weight lifted. The payoff. The celebrating behaviour adds
   *  the bounce. */
  celebrating: {
    handL: v(140, 140), handR: v(480, 120),
    handLType: "open", handRType: "open",
    rise: -10, stance: 10, brow: 0.9, eyes: 1.2, snap: 1.5,
  },

  /** Hands to the cheeks, body lifted, head straight. The reveal. */
  shocked: {
    handL: v(248, 196), handR: v(372, 196),
    handLType: "open", handRType: "open",
    rise: -6, stance: 10, brow: 0.8, eyes: 1.3, snap: 1.8,
  },

  /** Arms up and in front, weight shifted back. Defensive. */
  scared: {
    handL: v(168, 322), handR: v(452, 322),
    handLType: "open", handRType: "open",
    rise: 8, tilt: 5, stance: 8, brow: -0.5, snap: 1.6,
  },

  /** Fists at the sides, shoulders rolled forward. */
  angry: {
    handL: v(204, 470), handR: v(416, 470),
    handLType: "fist", handRType: "fist",
    lean: -5, tilt: 3, stance: 6, brow: -1, eyes: 0.9, snap: 1.6,
  },

  /** The weight gone out of the body. Hands hang limp, head droops. */
  sad: {
    handL: v(232, 543), handR: v(388, 543),
    rise: 12, tilt: -3, brow: -0.6, eyes: 0.85, snap: 1.1,
  },

  /** One hand on the hip, one fist lifted to the chest. The verdict. */
  confident: {
    handL: v(252, 496), handR: v(428, 300),
    handLType: "fist", handRType: "fist",
    tilt: -2, brow: 0.2, snap: 1.3,
  },

  /** Pelvis dropped, knees tucking up, hands reaching down to the lap. The
   *  rig's arms reach 300 and a seated lap sits ~50 past that, so the hands
   *  hover over the thighs — the cartoon sit. */
  sitting: {
    handL: v(268, 540), handR: v(352, 540),
    handLType: "open", handRType: "open",
    pelvisDrop: 140,
    footL: v(270, 886), footR: v(350, 886),
    tilt: 2, snap: 0.9,
  },

  /** Whole body rotated back about the pelvis, arms thrown out. The falling
   *  behaviour drives the roll; this is the shape at the start of it. */
  falling: {
    handL: v(150, 400), handR: v(470, 400),
    handLType: "open", handRType: "open",
    roll: 26, rise: 6, tilt: 6, snap: 1.8,
  },

  /** Knees tucked, arms up, off the ground. The jumping behaviour adds the
   *  parabola; this is the shape at its peak. */
  jumping: {
    handL: v(176, 280), handR: v(444, 240),
    handLType: "fist", handRType: "fist",
    kneeL: v(250, 690), kneeR: v(370, 690),
    footL: v(268, 780), footR: v(352, 780),
    brow: 1, eyes: 1.3, snap: 1.9,
  },

  // ------------------------- the gesture planner's vocabulary -------------
  // These are the poses the script planner (gestures.ts) emits. Same rig, same
  // proportions — authored for the new arm, so the planner keeps working
  // without its rules changing.

  /** Palm up, offered. For a definition, or a number being handed over. */
  offer: {
    handL: v(214, 480), handR: v(396, 388),
    handLType: "fist", handRType: "open",
    tilt: 4, brow: 0.2, snap: 0.9,
  },

  /** Both hands turned up, shoulders lifted. The "well, obviously". */
  shrug: {
    handL: v(172, 384), handR: v(448, 384),
    handLType: "open", handRType: "open",
    rise: -16, brow: 0.8, eyes: 1.05, snap: 1.3,
  },

  /** Hands apart at different heights — a scale that has already tipped.
   *  Level hands read as a shrug or a T-pose; the height difference is the
   *  compare. */
  weigh: {
    handL: v(128, 368), handR: v(492, 398),
    handLType: "open", handRType: "open",
    tilt: -4, snap: 1,
  },

  /** Hands close together, low. For "a small amount", "barely", "only". */
  pinch: {
    handL: v(288, 448), handR: v(332, 444),
    tilt: 3, brow: -0.3, eyes: 0.9, snap: 1.2,
  },

  /** One hand climbing on a diagonal. Deliberately not point_up: that one is
   *  vertical and means "listen", this one travels and means "it goes up". */
  rise: {
    handL: v(214, 480), handR: v(470, 150),
    handLType: "fist", handRType: "open",
    tilt: -6, lean: 8, brow: 0.7, eyes: 1.15, snap: 1.2,
  },

  /** Hands low and wide with the weight gone out of the body. For a loss, a
   *  fall, a fee eating a return. */
  fall: {
    handL: v(186, 436), handR: v(432, 444),
    rise: 12, tilt: 7, brow: -0.6, eyes: 0.85, snap: 1.4,
  },

  /** Arm straight out at head height. The "hold on" before a correction.
   *  Drawn side-on rather than as a palm to camera: a flat palm is a
   *  foreshortened pose and a stick figure has no foreshortening to spend. */
  halt: {
    handL: v(218, 470), handR: v(484, 262),
    handLType: "fist", handRType: "open",
    poleR: v(0.35, 1), brow: -0.7, eyes: 1.1, lean: -6, snap: 1.8,
  },

  /** Both arms wide. For scale — the payoff number, the big picture. */
  wide: {
    handL: v(54, 330), handR: v(566, 324),
    handLType: "open", handRType: "open",
    brow: 0.9, eyes: 1.2, rise: -8, stance: 6, snap: 1.4,
  },

  /** Hand to chest. For the sincere line, the "here's what I'd do". */
  chest: {
    handL: v(214, 480), handR: v(300, 338),
    poleR: v(0.3, 1),
    tilt: 3, brow: 0.15, snap: 0.8,
  },

  /** Hand up beside the head, counting off. For a list, or a run of figures. */
  count: {
    handL: v(214, 480), handR: v(452, 160),
    handLType: "fist", handRType: "open",
    tilt: -4, brow: 0.4, snap: 1.6,
  },
};

/**
 * The compiled pose library. Every entry is a full skeleton — every joint,
 * every face lean — so scenes can read actual coordinates, not just names.
 * `point_side` is the planner's historical name for `point_right`.
 */
export const POSES: Record<string, StickmanPose> = Object.fromEntries(
  Object.entries(SPECS).map(([name, spec]) => [name, buildPose(spec)]),
) as Record<string, StickmanPose>;

// The authored specs, kept for tooling and for poses that want to build on
// another pose's numbers.
export { SPECS };

/** Names, for pickers and documentation. */
export const POSE_NAMES = Object.keys(SPECS);

/** Head-length units, exported for anything that wants to size against the
 *  character's own proportions. */
export const HEAD = UNIT;

// ------------------------------------------------------------------ poseAt
/**
 * Which pose is active at time `t`, and how long it has been active.
 *
 * Returns `talk` while a cue's hold has expired but the voice is still going,
 * and `idle` when nothing has been said for a while. That fallback is the
 * difference between a character who gestures and a character stuck in a pose.
 */
export function poseAt(
  cues: GestureCue[],
  t: number,
  speaking: boolean,
): { pose: PoseSpec; name: string; since: number } {
  let active: GestureCue | null = null;
  for (const c of cues) {
    if (c.t > t) break;
    active = c;
  }
  const fallback = speaking ? "talk" : "idle";
  if (!active) return { pose: SPECS[fallback] ?? DEFAULT_POSE, name: fallback, since: t };

  // The hold is extended a little past the phrase: dropping the hand on the
  // last syllable makes the gesture look retracted rather than finished.
  const until = active.t + Math.max(0.7, active.hold) + 0.35;
  if (t > until) {
    return {
      pose: SPECS[fallback] ?? DEFAULT_POSE,
      name: fallback,
      since: t - until,
    };
  }
  return {
    pose: SPECS[active.pose] ?? DEFAULT_POSE,
    name: active.pose,
    since: t - active.t,
  };
}
