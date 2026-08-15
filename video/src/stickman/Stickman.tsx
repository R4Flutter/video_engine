// The character. One SVG, redrawn every frame from the rig, the viseme track,
// the gesture track and the expression track.
//
// Everything animated here is driven by one of four clocks:
//   the voice        — mouth shape, mouth energy, head bob
//   the gesture plan — arms, lean, brow, tilt
//   the expression   — brows, eyes, mouth when the voice is silent
//   nothing at all   — breathing, sway, blinks
//
// The fourth clock is not filler. A character whose only motion is speech
// reads as dead between sentences, and the small idle layer is what stops the
// pauses from looking like dropped frames.

import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { RIG, STICKMAN_STYLE } from "./constants";
import { boil, headPath, inkPath, lerp, lerpV, limbPath, v, Vec } from "./geometry";
import { blinkAmount, cascade, settle, spring01 } from "./motion";
import { buildPose, DEFAULT_POSE, poseAt, SPECS } from "./poses";
import type { FaceParams, GestureCue, PoseSpec, StickmanPose, StickmanProps } from "./types";
import { blendFace, DEFAULT_EXPRESSION, expressionAt, expressionByName } from "./expressions";
import { animIdle, ANIMATIONS } from "./animations";
import { Face } from "./face";
import { Hand } from "./hands";
import { Foot } from "./feet";
import { sampleEnergy, sampleMouth } from "./mouth";
import type { Cue } from "./mouth";

const vox = theme.vox;

/** Behaviours that keep the idle layer underneath — a talking body still
 *  breathes. The locomotion set replaces idle entirely. */
const HELD: ReadonlySet<string> = new Set([
  "talking", "waving", "nodding", "shaking", "reacting",
]);

/** Blend two authored specs into one, with per-joint timing.
 *
 * The torso and the scalars move on `kA`; the hands lag on `kC` and the head
 * on `kD` — the follow-through that makes a wrist arrive after its shoulder.
 * Leg overrides (sitting, jumping) blend against the *solved* joints of the
 * other pose so a knee never pops. */
function blendSpec(
  from: PoseSpec,
  to: PoseSpec,
  kA: number,
  kB: number,
  kC: number,
  kD: number,
  pFrom: StickmanPose,
  pTo: StickmanPose,
): PoseSpec {
  const f = (a?: number, b?: number, d = 0) => lerp(a ?? d, b ?? d, kA);
  const fh = (a?: number, b?: number, d = 0) => lerp(a ?? d, b ?? d, kD);
  const over = (
    a?: Vec,
    b?: Vec,
    fa?: Vec,
    fb?: Vec,
  ): Vec | undefined => {
    if (a && b) return lerpV(a, b, kA);
    if (a) return lerpV(a, fb ?? a, kA);
    if (b) return lerpV(fa ?? b, b, kA);
    return undefined;
  };
  return {
    handL: lerpV(from.handL, to.handL, kC),
    handR: lerpV(from.handR, to.handR, kC),
    // The elbow trails the shoulder by `kB`, then the hand trails the elbow
    // by `kC` — the follow-through that stops a gesture from moving as one
    // rigid piece.
    poleL: lerpV(from.poleL ?? v(-0.42, 0.91), to.poleL ?? v(-0.42, 0.91), kB),
    poleR: lerpV(from.poleR ?? v(0.42, 0.91), to.poleR ?? v(0.42, 0.91), kB),
    handLType: kC > 0.6 ? to.handLType ?? "fist" : from.handLType ?? "fist",
    handRType: kC > 0.6 ? to.handRType ?? "fist" : from.handRType ?? "fist",
    tilt: fh(from.tilt, to.tilt),
    turn: fh(from.turn, to.turn),
    headDip: fh(from.headDip, to.headDip),
    lean: f(from.lean, to.lean),
    rise: f(from.rise, to.rise),
    roll: f(from.roll, to.roll),
    stance: f(from.stance, to.stance),
    pelvisDrop: f(from.pelvisDrop, to.pelvisDrop),
    brow: f(from.brow, to.brow),
    eyes: f(from.eyes, to.eyes, 1),
    bob: f(from.bob, to.bob, 5),
    snap: to.snap ?? 1,
    kneeL: over(from.kneeL, to.kneeL, pFrom.leftKnee, pTo.leftKnee),
    kneeR: over(from.kneeR, to.kneeR, pFrom.rightKnee, pTo.rightKnee),
    footL: over(from.footL, to.footL, pFrom.leftFoot, pTo.leftFoot),
    footR: over(from.footR, to.footR, pFrom.rightFoot, pTo.rightFoot),
    kneePoleL: lerpV(from.kneePoleL ?? v(-0.2, 1), to.kneePoleL ?? v(-0.2, 1), kA),
    kneePoleR: lerpV(from.kneePoleR ?? v(0.2, 1), to.kneePoleR ?? v(0.2, 1), kA),
  };
}

export const Stickman: React.FC<StickmanProps> = ({
  t,
  cues = [],
  env = [],
  envHz = 100,
  beatT = 0,
  gestures,
  height,
  x = 0.5,
  y = 0.94,
  flip = false,
  opacity = 1,
  pose,
  expression,
  expressions,
  animation,
  enter,
  exit,
  dur,
  lookAt,
  scale: extraScale = 1,
  color,
  paper,
}) => {
  const frame = useCurrentFrame();
  const { width: cw, height: ch, fps } = useVideoConfig();
  const jit = boil(frame, 7);
  // SVG ids are global to the document. Two stickmen on one frame sharing a
  // clip path means the second one wears the first one's mouth.
  const clipId = `mouth-${React.useId().replace(/:/g, "")}`;

  // ------------------------------------------------------------- the voice
  const speaking =
    cues.length > 0 &&
    beatT >= cues[0].t - 0.2 &&
    beatT <= cues[cues.length - 1].t + 0.3;
  const shape = speaking ? sampleMouth(cues, beatT) : null;
  const energy = speaking ? sampleEnergy(env, beatT, envHz) : 0;

  // ------------------------------------------------------------- the pose
  // Two sources: a declarative pose name (held, from/to identical) or the
  // gesture track (which pose is active now, and which it came from, so the
  // body can travel between them instead of teleporting).
  let from: PoseSpec;
  let to: PoseSpec;
  let since = 0;
  if (pose) {
    to = SPECS[pose] ?? DEFAULT_POSE;
    from = to;
  } else {
    const cues2: GestureCue[] = gestures ?? [];
    let prev = "idle";
    let cur: GestureCue | null = null;
    for (const c of cues2) {
      if (c.t > t) break;
      if (cur) prev = cur.pose;
      cur = c;
    }
    const at = poseAt(cues2, t, speaking);
    from = SPECS[prev] ?? DEFAULT_POSE;
    to = at.pose;
    since = at.since;
  }

  const staticPose = Boolean(pose);
  const snap = to.snap ?? 1;
  // Per-joint timing: the torso and legs on `kA`, the elbows a frame behind,
  // the wrists and hands two frames behind, the head half a frame behind the
  // shoulders. The delays are the secondary motion — nobody moves as one
  // rigid piece, and the eye reads the stagger as weight.
  const kA = staticPose ? 1 : settle(since, snap);
  const kB = staticPose ? 1 : cascade(since, snap, 0.045);
  const kC = staticPose ? 1 : cascade(since, snap, 0.09);
  const kD = staticPose ? 1 : cascade(since, snap, 0.035);

  // The resolved skeleton the overrides blend against, so a knee moving from
  // "sitting" to "standing" travels through real joints, not through a pop.
  const pFrom = buildPose(from, 0);
  const pTo = buildPose(to, 0);
  let spec = blendSpec(from, to, kA, kB, kC, kD, pFrom, pTo);

  // ------------------------------------------------------- the behaviours
  const anim = animation ?? (speaking ? "talking" : "idle");
  const ctx = { t, fps, energy, speaking };
  if (anim === "idle") {
    spec = animIdle(spec, ctx);
  } else {
    spec = ANIMATIONS[anim](spec, ctx);
    if (HELD.has(anim)) spec = animIdle(spec, ctx);
  }

  // ------------------------------------------------------------ the body
  const pose3 = buildPose(spec, energy);

  // --------------------------------------------------------------- the face
  let faceFrom: FaceParams;
  let faceTo: FaceParams;
  let faceSince = 0;
  if (expressions?.length) {
    const fa = expressionAt(expressions, t);
    faceFrom = fa.from;
    faceTo = fa.to;
    faceSince = fa.since;
  } else if (expression) {
    faceFrom = faceTo = expressionByName(expression);
  } else {
    faceFrom = faceTo = DEFAULT_EXPRESSION;
  }
  const kF = expression && !expressions?.length ? 1 : settle(faceSince, 1.3);
  let face = blendFace(faceFrom, faceTo, kF);

  // The pose gets a say in the face: a wide-eyed pose widens the eyes, a
  // furrowed one lowers the brows. Then the blink on top — a blink is not an
  // expression, it is a necessity, and it belongs after everything else.
  const blink = blinkAmount(t);
  face = {
    ...face,
    eyeOpen: Math.min(1.5, face.eyeOpen * (spec.eyes ?? 1) * (1 - blink * 0.96)),
    browHeight: face.browHeight + (spec.brow ?? 0) * 0.45,
  };

  // Pupils look where the scene tells them to. `lookAt` is a canvas point;
  // the pose's `turn` also drags them along.
  if (lookAt) {
    const scalePx = (height * extraScale) / RIG.box.h;
    const left = cw * x - (RIG.box.w * scalePx) / 2;
    const top = ch * y - height * extraScale;
    const rx = (lookAt.x - left) / scalePx;
    const ry = (lookAt.y - top) / scalePx;
    const fx = flip ? RIG.box.w - rx : rx;
    face = {
      ...face,
      pupilDrift: v(
        Math.max(-6, Math.min(6, (fx - pose3.head.x) * 0.22)),
        Math.max(-6, Math.min(6, (ry - pose3.head.y) * 0.22)),
      ),
    };
  }

  // -------------------------------------------------------------- staging
  const scalePx = (height * extraScale) / RIG.box.h;
  const left = cw * x - (RIG.box.w * scalePx) / 2;
  const top = ch * y - height * extraScale;

  let op = 1;
  let tx = 0;
  let ty = 0;
  let sc = 1;
  if (enter) {
    const k = interpolate(frame, [0, 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    if (enter === "fadeIn") op = k;
    else if (enter === "slideIn") {
      op = k;
      tx = (flip ? 80 : -80) * (1 - k);
    } else if (enter === "popIn") {
      sc = 0.55 + 0.45 * spring01(frame / fps, 0.42, 3.2);
      op = Math.min(1, frame / 9);
    } else if (enter === "riseIn") {
      op = k;
      ty = 46 * (1 - k);
    }
  }
  if (exit && dur) {
    const e = Math.min(1, (frame - (dur - 10)) / 10);
    if (e > 0) {
      if (exit === "fadeOut") op *= 1 - e;
      else if (exit === "slideOut") {
        tx += (flip ? -90 : 90) * e;
        op *= 1 - e;
      } else if (exit === "dropOut") {
        ty += 34 * e;
        op *= 1 - e;
      }
    }
  }

  const ink = color ?? vox.ink;
  const paperColor = paper ?? vox.paper;
  const s = {
    stroke: ink,
    strokeWidth: STICKMAN_STYLE.stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  const sLimb = { ...s, strokeWidth: STICKMAN_STYLE.limbStroke };

  // The shadow shrinks and fades as the feet leave the ground.
  const lift = Math.max(0, RIG.ground - pose3.leftFoot.y);
  const shadowR = 92 * (1 - Math.min(0.5, lift * 0.004));
  const shadowO = STICKMAN_STYLE.shadow.opacity * (1 - Math.min(0.6, lift * 0.006));

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: RIG.box.w * scalePx,
        height: height * extraScale,
        opacity: opacity * op,
        transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
      }}
    >
      <div style={{ width: "100%", height: "100%", transform: flip ? "scaleX(-1)" : undefined }}>
        <svg
          viewBox={`0 0 ${RIG.box.w} ${RIG.box.h}`}
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          {/* Contact shadow. One soft ellipse — the character stands on paper,
              and paper does not cast a raytraced shadow. */}
          <ellipse
            cx={pose3.pelvis.x}
            cy={RIG.ground + 13}
            rx={shadowR}
            ry={STICKMAN_STYLE.shadow.ry}
            fill={ink}
            opacity={shadowO}
          />

          {/* The roll group: a fall or a dive rotates the whole body about the
              pelvis while the shadow stays where the ground is. */}
          <g
            transform={
              pose3.roll !== 0
                ? `rotate(${pose3.roll.toFixed(1)} ${pose3.pelvis.x.toFixed(1)} ${pose3.pelvis.y.toFixed(1)})`
                : undefined
            }
          >
            {/* Legs and arms go behind the torso so the joins are hidden. */}
            <path d={limbPath([pose3.pelvis, pose3.leftKnee, pose3.leftAnkle], jit, 10)} {...sLimb} />
            <path d={limbPath([pose3.pelvis, pose3.rightKnee, pose3.rightAnkle], jit, 14)} {...sLimb} />
            <Foot at={pose3.leftFoot} ink={ink} jit={jit} i={58} />
            <Foot at={pose3.rightFoot} ink={ink} jit={jit} i={62} />

            <path d={limbPath([pose3.leftShoulder, pose3.leftElbow, pose3.leftWrist], jit, 18)} {...sLimb} />
            <path d={limbPath([pose3.rightShoulder, pose3.rightElbow, pose3.rightWrist], jit, 22)} {...sLimb} />
            <Hand at={pose3.leftWrist} from={pose3.leftElbow} type={spec.handLType ?? "fist"} ink={ink} jit={jit} i={30} />
            <Hand at={pose3.rightWrist} from={pose3.rightElbow} type={spec.handRType ?? "fist"} ink={ink} jit={jit} i={34} />

            {/* Torso: neck to pelvis, with the shoulder line across it. */}
            <path d={inkPath(pose3.neck, pose3.pelvis, jit, 2)} {...s} />
            <path d={inkPath(pose3.leftShoulder, pose3.rightShoulder, jit, 5)} {...s} strokeWidth={STICKMAN_STYLE.shoulderStroke} />

            {/* Head, filled with paper so the neck stroke does not show
                through. */}
            <path
              d={headPath(pose3.head.x, pose3.head.y, RIG.head.r, jit)}
              {...s}
              fill={paperColor}
            />

            <Face
              head={pose3.head}
              tilt={pose3.tilt}
              turn={pose3.turn}
              face={face}
              shape={shape}
              energy={energy}
              ink={ink}
              paper={paperColor}
              jit={jit}
              clipId={clipId}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

/** Kept for callers that want the pose vocabulary without importing two files. */
export { POSES } from "./poses";
export type { Cue };
