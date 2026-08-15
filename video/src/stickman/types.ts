// The vocabulary every other stickman module shares: the full-joint pose, the
// authored pose spec, the face, the expressions, the props. Types only — no
// behaviour here, so importing this file costs nothing.

import type { Vec } from "./geometry";

/** Every joint on the body, in rig-space coordinates. This is the runtime
 *  shape the rig produces and the renderer consumes. */
export type StickmanPose = {
  head: Vec;
  neck: Vec;

  leftShoulder: Vec;
  leftElbow: Vec;
  leftWrist: Vec;
  leftHand: Vec;

  rightShoulder: Vec;
  rightElbow: Vec;
  rightWrist: Vec;
  rightHand: Vec;

  pelvis: Vec;

  leftKnee: Vec;
  leftAnkle: Vec;
  leftFoot: Vec;

  rightKnee: Vec;
  rightAnkle: Vec;
  rightFoot: Vec;

  /** Head rotation in degrees, positive tilts toward screen right. */
  tilt: number;
  /** Head lateral shift toward a point of interest, in rig units. */
  turn: number;
  /** Whole-body rotation about the pelvis, degrees. Falling, leaning into a
   *  punchline — the things a spine cannot do on its own. */
  roll: number;
};

/** How a hand is drawn. Five gestures cover an explainer's entire vocabulary:
 *  open (showing), fist (neutral/emphasis), point (the chart), thumbs up (the
 *  verdict) and hold (gripping something off-screen or between the hands). */
export type HandType = "open" | "fist" | "point" | "thumbsUp" | "hold";

export type ExpressionName =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "confused"
  | "shocked"
  | "scared"
  | "excited"
  | "worried"
  | "thinking"
  | "confident"
  | "disappointed"
  | "laughing";

/** What the mouth is doing when it is not lip-syncing. Each kind is drawn from
 *  two or three numbers, never a bitmap, so expressions blend frame to frame. */
export type MouthKind =
  | "line"
  | "smile"
  | "frown"
  | "open"
  | "wavy"
  | "smirk"
  | "grit"
  | "pucker";

/** A face, fully described by numbers so expressions can be blended. */
export type FaceParams = {
  /** Brow height; 1 = neutral, >1 raised, <1 lowered. */
  browHeight: number;
  /** Brow angles in degrees. Positive raises the inner end of the brow:
   *  left brow +8° and right -8° is a sad raise, the reverse is a glare. */
  browTiltL: number;
  browTiltR: number;
  /** Eye openness: 1 = normal, >1 wide (shock), ~0 closed (blink/laugh). */
  eyeOpen: number;
  /** Pupil size, 0..1. Shock shrinks, excitement grows. */
  pupil: number;
  /** Pupil drift toward a point of interest, head-local units. */
  pupilDrift: Vec;
  /** Mouth shape and its envelope. */
  mouth: MouthKind;
  /** 0..1 openness (open mouth kinds). */
  mouthOpen: number;
  /** Mouth width multiplier around the neutral width. */
  mouthWide: number;
  /** Mouth curvature: -1 frown .. +1 smile. */
  mouthCurve: number;
};

/**
 * What an author writes when naming a pose. Hand targets are absolute rig
 * positions; everything else is optional and defaults to the neutral body.
 *
 * The one rule when writing a pose: keep each hand between about 120 and 285
 * from its own shoulder. Under ~120 the arm has nowhere to put 300 units of
 * bone and the elbow swings out into a chicken wing; over ~285 the arm locks
 * straight and the elbow disappears. Everything expressive lives in between,
 * and `npm run rig` prints the distance for every pose so this is checkable
 * rather than a matter of opinion.
 */
export type PoseSpec = {
  /** Hand targets in rig space. handL is the arm on screen left. */
  handL: Vec;
  handR: Vec;
  /** Where the elbow wants to be, as a direction from the shoulder. Omitted
   *  means down and slightly out, which is where elbows are. Override it for
   *  the few poses that read wrong that way. */
  poleL?: Vec;
  poleR?: Vec;
  /** How each hand is drawn. */
  handLType?: HandType;
  handRType?: HandType;

  /** Head rotation in degrees, positive tilts toward screen right. */
  tilt?: number;
  /** Head lateral shift toward something off to the side, rig units. */
  turn?: number;
  /** Head dip. Positive moves the head down — a nod, a sigh. Rig units. */
  headDip?: number;
  /** Whole-body lean, in rig units. Positive leans toward screen right. */
  lean?: number;
  /** Torso rise. Negative lifts — a shrug, or a breath held before a reveal. */
  rise?: number;
  /** Whole-body rotation about the pelvis, degrees. */
  roll?: number;
  /** Feet spread; 0 is a neutral stance. */
  stance?: number;
  /** Lower the pelvis (sitting). In rig units, positive = down. */
  pelvisDrop?: number;

  /** Leg overrides — used by sitting and jumping where the feet leave the
   *  ground and the knees fold. Omitted means "solved from the feet". */
  footL?: Vec;
  footR?: Vec;
  kneeL?: Vec;
  kneeR?: Vec;
  /** Knee bend direction, as a direction from the pelvis. Defaults bend the
   *  knees slightly outward, the way a relaxed stance does. */
  kneePoleL?: Vec;
  kneePoleR?: Vec;

  /** Brow height, -1 furrowed to 1 raised. Multiplies the expression's brows. */
  brow?: number;
  /** Eye openness, 1 normal, >1 wide. Multiplies the expression's eyes. */
  eyes?: number;
  /** How much the head rides the speech envelope. 0 = stone still. */
  bob?: number;
  /** How fast the body gets here. Low is a lazy drift, high is a snap. */
  snap?: number;
};

export type PoseName = string;

/** A pose on a timeline: `pose` is a name from the library. */
export type GestureCue = {
  /** Seconds, absolute on the episode timeline. */
  t: number;
  pose: PoseName;
  /** Seconds. After this the body drifts back to `talk`, or `idle` if silent. */
  hold: number;
};

/** An expression on a timeline. */
export type ExpressionCue = {
  t: number;
  expression: ExpressionName;
  hold: number;
};

export type EnterName = "fadeIn" | "slideIn" | "popIn" | "riseIn";
export type ExitName = "fadeOut" | "slideOut" | "dropOut";

export type AnimationName =
  | "idle"
  | "talking"
  | "walking"
  | "running"
  | "waving"
  | "nodding"
  | "shaking"
  | "jumping"
  | "falling"
  | "celebrating"
  | "reacting";

/**
 * The component's props.
 *
 * The two layers of the API:
 *   1. the legacy voice/gesture track — `t`, `cues`, `env`, `beatT`,
 *      `gestures` — driven by the lipsync and gesture planner;
 *   2. the declarative layer — `pose`, `expression`, `expressions`,
 *      `animation`, `enter`, `exit` — for scenes that author the character by
 *      intent. Both can be mixed: a declarative pose with a viseme track is a
 *      scene that says what he does and lets the audio drive his mouth.
 */
export type StickmanProps = {
  /** Seconds on the episode timeline. */
  t: number;
  /** Viseme cues for the beat being spoken, in beat-local seconds. */
  cues?: { t: number; v: string }[];
  /** Loudness envelope for that beat, and its sample rate. */
  env?: number[];
  envHz?: number;
  /** Seconds into the current beat. */
  beatT?: number;
  /** The gesture track: where his hands go, and when. */
  gestures?: GestureCue[];
  /** Height of the character on the canvas, in px. Width follows the rig. */
  height: number;
  /** Where the feet stand, as a fraction of the canvas. */
  x?: number;
  y?: number;
  /** Mirror the whole character. Useful when the chart is on the other side. */
  flip?: boolean;
  opacity?: number;

  /** Declarative pose: a name from the library, held until changed. */
  pose?: PoseName;
  /** Static expression. */
  expression?: ExpressionName;
  /** An expression track, like the gesture track. */
  expressions?: ExpressionCue[];
  /** A behaviour layered over the pose — talking, walking, reacting... */
  animation?: AnimationName;
  /** How the character enters the frame. Frames are relative to mount. */
  enter?: EnterName;
  /** How the character leaves. Needs `dur` to know when the scene ends. */
  exit?: ExitName;
  /** Scene length in frames — only used to time the exit. */
  dur?: number;
  /** A point on the canvas his eyes look at, in canvas coordinates. */
  lookAt?: Vec | null;
  /** Extra scale multiplier on top of `height`. */
  scale?: number;
  /** Override the stroke ink. Defaults to the vox ink. */
  color?: string;
  /** Override the paper fill of the head. Defaults to the vox paper. */
  paper?: string;
};
