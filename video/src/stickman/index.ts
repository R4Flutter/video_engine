// The public face of the stickman engine. Scenes import from here; the internals
// stay where they belong — geometry in geometry.ts, poses in poses.ts, faces in
// expressions.ts, motion in animations.ts, rendering in the components.

export { Stickman } from "./Stickman";
export { POSES, SPECS, POSE_NAMES, buildPose, poseAt, DEFAULT_POSE, HEAD } from "./poses";
export { EXPRESSIONS, EXPRESSION_NAMES, blendFace, expressionAt, expressionByName, DEFAULT_EXPRESSION } from "./expressions";
export { ANIMATIONS, animIdle, animTalking, animWalking, animRunning, animWaving, animNodding, animShaking, animJumping, animFalling, animCelebrating, animReacting } from "./animations";
export { RIG, STICKMAN_STYLE, UNIT } from "./constants";
export { solveArm, solveJoint, solveLeg, boil, limbPath, headPath, inkPath, v, add, sub, scale, len, lerp, lerpV, clamp, dir, rotV } from "./geometry";
export { settle, cascade, spring01, blinkAmount, loop01, recoil, easeOutCubic } from "./motion";
export { mouthPaths, sampleMouth, sampleEnergy, SHAPES } from "./mouth";
export type { MouthShape, Cue } from "./mouth";
export type {
  StickmanProps,
  StickmanPose,
  PoseSpec,
  PoseName,
  GestureCue,
  ExpressionCue,
  ExpressionName,
  FaceParams,
  MouthKind,
  HandType,
  AnimationName,
  EnterName,
  ExitName,
} from "./types";
export { plan, planBeat, parseNotes } from "./gestures";
