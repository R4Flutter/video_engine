// The expression system: thirteen faces, each a small set of numbers that the
// face renderer turns into geometry, blended frame-to-frame so the character
// is never *in* an expression, always on the way to the next one.
//
// The rules of the system:
//   - the brows carry most of the emotion (angle is the emotion, height is the
//     volume of it);
//   - the eyes carry the attention (openness is the reaction);
//   - the mouth carries the sound (it is the last thing to change, because
//     speech overrides it anyway when there is a viseme track).

import type { ExpressionCue, ExpressionName, FaceParams } from "./types";
import { v } from "./geometry";

const F = (
  browHeight: number,
  browTiltL: number,
  browTiltR: number,
  eyeOpen: number,
  pupil: number,
  px: number,
  py: number,
  mouth: FaceParams["mouth"],
  mouthOpen: number,
  mouthWide: number,
  mouthCurve: number,
): FaceParams => ({
  browHeight,
  browTiltL,
  browTiltR,
  eyeOpen,
  pupil,
  pupilDrift: v(px, py),
  mouth,
  mouthOpen,
  mouthWide,
  mouthCurve,
});

export const EXPRESSIONS: Record<ExpressionName, FaceParams> = {
  /** The zero state: everything at 1, a small straight mouth. */
  neutral: F(1, 0, 0, 1, 0.5, 0, 0, "line", 0, 0.5, 0),

  /** Raised brows, a soft squint, a warm smile. */
  happy: F(1.15, 0, 0, 0.85, 0.5, 0, 0, "smile", 0.15, 0.62, 0.55),

  /** Inner brows up, eyes half-lidded, mouth corners down. */
  sad: F(0.95, 7, -7, 0.75, 0.45, 0, -1, "frown", 0.05, 0.55, -0.4),

  /** Brows down and in, narrowed eyes, a pressed mouth. */
  angry: F(0.8, -8, 8, 0.8, 0.4, 0, 0, "frown", 0.05, 0.5, -0.35),

  /** One brow up, the other level; a wavy mouth; the eyes drift up. */
  confused: F(1.1, 6, -2, 0.85, 0.45, 0, -3, "wavy", 0, 0.5, 0),

  /** Brows to the ceiling, eyes as wide as they get, small pupils, an O. */
  shocked: F(1.5, 0, 0, 1.4, 0.35, 0, 0, "open", 0.85, 0.6, 0),

  /** Brows high and angled in, wide eyes, a small open mouth. */
  scared: F(1.35, -5, 5, 1.35, 0.3, 0, 2, "open", 0.5, 0.5, 0),

  /** Everything open: wide eyes, big smile with room in it. */
  excited: F(1.4, 0, 0, 1.2, 0.6, 0, -2, "smile", 0.4, 0.7, 0.7),

  /** Brows up and inward, narrowed eyes, a small wavy mouth. */
  worried: F(1.2, 6, 6, 0.7, 0.4, 0, 1, "wavy", 0, 0.45, 0),

  /** One brow up, the eyes off to the side, a wavy mouth. */
  thinking: F(1.05, 7, -1, 0.95, 0.5, -3, -4, "wavy", 0, 0.45, 0),

  /** Level brows, a settled squint, a one-corner smile. The verdict face. */
  confident: F(1, -3, 3, 0.85, 0.55, 0, 0, "smirk", 0, 0.55, 0.35),

  /** Inner brows up, eyes downcast, a small flat mouth. */
  disappointed: F(0.9, 5, 5, 0.7, 0.4, 0, 1, "frown", 0, 0.5, -0.3),

  /** Brows up, eyes squeezed shut, a big open laugh. */
  laughing: F(1.3, 0, 0, 0.12, 0, 0, -2, "smile", 0.5, 0.72, 0.75),
};

export const EXPRESSION_NAMES = Object.keys(EXPRESSIONS) as ExpressionName[];

export const DEFAULT_EXPRESSION: FaceParams = EXPRESSIONS.neutral;

/** Blend two faces. The mouth kind snaps at the end of the transition — a
 *  wavy mouth mid-way to a smile is mush, not a feeling. */
export function blendFace(a: FaceParams, b: FaceParams, t: number): FaceParams {
  const k = Math.max(0, Math.min(1, t));
  return {
    browHeight: a.browHeight + (b.browHeight - a.browHeight) * k,
    browTiltL: a.browTiltL + (b.browTiltL - a.browTiltL) * k,
    browTiltR: a.browTiltR + (b.browTiltR - a.browTiltR) * k,
    eyeOpen: a.eyeOpen + (b.eyeOpen - a.eyeOpen) * k,
    pupil: a.pupil + (b.pupil - a.pupil) * k,
    pupilDrift: v(
      a.pupilDrift.x + (b.pupilDrift.x - a.pupilDrift.x) * k,
      a.pupilDrift.y + (b.pupilDrift.y - a.pupilDrift.y) * k,
    ),
    mouth: k > 0.65 ? b.mouth : a.mouth,
    mouthOpen: a.mouthOpen + (b.mouthOpen - a.mouthOpen) * k,
    mouthWide: a.mouthWide + (b.mouthWide - a.mouthWide) * k,
    mouthCurve: a.mouthCurve + (b.mouthCurve - a.mouthCurve) * k,
  };
}

export function expressionByName(name: ExpressionName): FaceParams {
  return EXPRESSIONS[name] ?? DEFAULT_EXPRESSION;
}

/**
 * The face active at time `t` on an expression track. Same hold semantics as
 * the gesture track: after the hold expires the face relaxes back to neutral,
 * because a face stuck in shock is a face that stopped reacting.
 */
export function expressionAt(
  cues: ExpressionCue[],
  t: number,
): { from: FaceParams; to: FaceParams; since: number } {
  let prev: ExpressionCue | null = null;
  let active: ExpressionCue | null = null;
  for (const c of cues) {
    if (c.t > t) break;
    prev = active;
    active = c;
  }
  const neutral = { from: DEFAULT_EXPRESSION, to: DEFAULT_EXPRESSION, since: t };
  if (!active) return neutral;

  // Faces blend from whatever was before into the new one; the first cue on
  // the track blends in from neutral.
  const from = prev ? expressionByName(prev.expression) : DEFAULT_EXPRESSION;
  const until = active.t + Math.max(0.7, active.hold) + 0.35;
  if (t > until) {
    return { from: expressionByName(active.expression), to: DEFAULT_EXPRESSION, since: t - until };
  }
  return { from, to: expressionByName(active.expression), since: t - active.t };
}
