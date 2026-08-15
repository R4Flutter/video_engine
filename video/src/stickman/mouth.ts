// The mouth: ten shapes, described as numbers so they can be blended.
//
// The obvious way to build a viseme mouth is ten SVG paths and swap between
// them. That is what a flipbook does and it looks like one: the mouth teleports
// between shapes and the eye reads the cut, not the speech. Real lips travel —
// they are already opening for the vowel while the consonant is still closing.
//
// So each shape is a small set of parameters, the parameters are what get
// interpolated, and the path is rebuilt every frame from the blended numbers.
// The mouth is then never in a viseme; it is always on its way to the next one,
// which is what speech actually looks like.

export type MouthShape = {
  /** Corner-to-corner width, as a fraction of RIG.face.mouth.w. */
  w: number;
  /** Opening, as a fraction of RIG.face.mouth.h. */
  h: number;
  /** 0 = corners stay put, 1 = corners pull in and the lips pucker. */
  round: number;
  /** Upper teeth showing across the top of the opening. */
  teeth: number;
  /** Lower lip drawn back under the upper teeth — the /f/ and /v/ tell. */
  tuck: number;
  /** Tongue visible in the opening. */
  tongue: number;
  /** How much the opening sits below the lip line vs. splitting it. A wide
   *  /iː/ opens symmetrically; an /ɑː/ drops the jaw and opens downward. */
  drop: number;
};

const S = (
  w: number, h: number, round = 0, teeth = 0, tuck = 0, tongue = 0, drop = 0.5,
): MouthShape => ({ w, h, round, teeth, tuck, tongue, drop });

/**
 * The ten shapes. Values were set by asking, for each pair, "could a lip reader
 * tell these apart" — if not, one of them is wrong.
 *
 * MBP is the only one with h = 0. A closed mouth is load-bearing: it is the
 * single frame that tells the viewer the audio and the drawing agree, and if
 * /m/ /b/ /p/ don't fully close, nothing else in the track will convince them.
 */
export const SHAPES: Record<string, MouthShape> = {
  REST: S(0.52, 0.04, 0.05),
  // Narrower than REST, and shut. Two closed mouths that look identical give
  // the viewer nothing to read on /m/ /b/ /p/, and those are the frames where
  // the sync is either believed or not — so the press is drawn, not implied.
  MBP: S(0.44, 0.0, 0.12),
  FV: S(0.50, 0.15, 0.0, 0.9, 1),
  TH: S(0.46, 0.30, 0.05, 0.3, 0, 0.95),
  L: S(0.44, 0.46, 0.1, 0.15, 0, 0.8, 0.62),
  WQ: S(0.22, 0.34, 1.0),
  E: S(0.68, 0.34, 0.0, 0.5, 0, 0, 0.45),
  S: S(0.58, 0.19, 0.0, 0.85),
  AI: S(0.60, 0.85, 0.12, 0.2, 0, 0.15, 0.72),
  O: S(0.38, 0.68, 0.75, 0, 0, 0, 0.6),
};

const KEYS = Object.keys(SHAPES.REST) as (keyof MouthShape)[];

export const blend = (a: MouthShape, b: MouthShape, t: number): MouthShape => {
  const out = {} as MouthShape;
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
};

export type Cue = { t: number; v: string };

/** Smoothstep. Lips accelerate out of one shape and decelerate into the next;
 *  a linear crossfade makes them look like they are on rails. */
const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * The mouth at time `t`, in seconds relative to the start of the beat.
 *
 * Interpolates between the cue before `t` and the cue after it. `coart` is the
 * co-articulation window: the fraction of the gap spent moving rather than
 * held. At 1 the mouth is in permanent motion and every shape gets averaged
 * away; at 0 it snaps. 0.72 keeps a readable hold on slow syllables while
 * still gliding through fast ones.
 *
 * One exception: a closure is never blended away. /m/ /b/ /p/ get a hard
 * approach so the lips actually meet — see `SHUT` below.
 */
export function sampleMouth(cues: Cue[], t: number, coart = 0.72): MouthShape {
  if (!cues.length) return SHAPES.REST;

  // Binary search for the last cue at or before t.
  let lo = 0;
  let hi = cues.length - 1;
  if (t <= cues[0].t) return SHAPES[cues[0].v] ?? SHAPES.REST;
  if (t >= cues[hi].t) return SHAPES[cues[hi].v] ?? SHAPES.REST;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].t <= t) lo = mid;
    else hi = mid;
  }

  const a = cues[lo];
  const b = cues[hi];
  const span = Math.max(0.0001, b.t - a.t);
  const raw = (t - a.t) / span;

  const A = SHAPES[a.v] ?? SHAPES.REST;
  const B = SHAPES[b.v] ?? SHAPES.REST;

  // A closure has to land. Reaching MBP early and holding it costs a frame of
  // the previous sound and buys the one thing the eye actually checks.
  const SHUT = 0.55;
  const k = b.v === "MBP" ? Math.min(1, raw / SHUT) : (raw - (1 - coart)) / coart;
  return blend(A, B, ease(Math.min(1, Math.max(0, k))));
}

/**
 * The drawn mouth, as two SVG paths: the lip outline and the dark opening.
 *
 * `energy` is the wav's own loudness at this instant, 0..1. It scales the
 * opening but not the width — a quiet word still makes the shape, it just makes
 * it smaller, which is exactly what a person does. Multiplying width by energy
 * too would make quiet speech look like a distant character rather than a soft
 * one. A floor of 0.35 stops the mouth flatlining on a consonant's dip.
 */
export function mouthPaths(
  s: MouthShape,
  baseW: number,
  baseH: number,
  energy: number,
) {
  const gain = 0.35 + 0.65 * Math.min(1, Math.max(0, energy));
  const w = s.w * baseW;
  const h = s.h * baseH * gain;
  const hw = w / 2;

  // The lip line. Corners lift a little as the mouth rounds, which is what
  // stops WQ and O reading as a hole punched in the face.
  const corner = s.round * h * 0.22;
  const up = h * (1 - s.drop);
  const down = h * s.drop;
  // Rounding also bows the lips outward at the centre rather than pulling the
  // opening into a lens.
  const bow = 1 + s.round * 0.5;

  const lip =
    `M ${-hw} ${-corner}` +
    ` C ${-hw * 0.55} ${-up * bow - corner} ${hw * 0.55} ${-up * bow - corner} ${hw} ${-corner}` +
    ` C ${hw * 0.55} ${down * bow - corner} ${-hw * 0.55} ${down * bow - corner} ${-hw} ${-corner}` +
    ` Z`;

  // Teeth sit inside the top of the opening and are clipped to it, so they
  // appear only as much as the mouth is actually open.
  const teeth =
    s.teeth > 0.02 && h > 1.5
      ? `M ${-hw * 0.78} ${-corner} L ${hw * 0.78} ${-corner} L ${hw * 0.7} ${-corner + Math.min(h * 0.3, 5) * s.teeth} L ${-hw * 0.7} ${-corner + Math.min(h * 0.3, 5) * s.teeth} Z`
      : null;

  const tongue =
    s.tongue > 0.05 && h > 4
      ? `M ${-hw * 0.42} ${down * bow - corner} Q 0 ${down * bow - corner - h * 0.55 * s.tongue} ${hw * 0.42} ${down * bow - corner} Z`
      : null;

  // The /f/ tuck: a short stroke where the lower lip disappears under the
  // teeth. Drawn rather than shaped, because at this scale the shape change is
  // two pixels and the stroke is what the eye picks up.
  const tuck =
    s.tuck > 0.1
      ? `M ${-hw * 0.85} ${down * 0.5 + 2} Q 0 ${down * 0.5 + 3 + 3 * s.tuck} ${hw * 0.85} ${down * 0.5 + 2}`
      : null;

  return { lip, teeth, tongue, tuck, open: h > 1.2 };
}

/** Loudness from the baked envelope. Linear between samples: the envelope is
 *  already smoothed, so anything fancier here is smoothing smoke. */
export function sampleEnergy(env: number[], t: number, hz: number) {
  if (!env.length) return 1;
  const x = t * hz;
  if (x <= 0) return env[0];
  if (x >= env.length - 1) return env[env.length - 1];
  const i = Math.floor(x);
  return env[i] + (env[i + 1] - env[i]) * (x - i);
}
