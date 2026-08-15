// The skeleton, the stroke system and the proportions. Nothing here draws —
// Stickman.tsx does that — so the look can be argued about in one place.
//
// Everything is in a local 620x935 box that the component scales to the canvas.
// Working in fixed units rather than percentages means a pose written as
// "hand at (470, 300)" means the same thing in a 9:16 Short and a 16:9 essay.
//
// Proportions, in head-lengths (one unit = one head diameter):
//
//   head          1.0
//   neck + torso  2.3
//   legs          2.5
//   arms          2.0
//
// Deliberately a little stylised: the head is a touch larger than life so the
// face survives thumbnail size, and the legs are a touch longer than a real
// person's so the silhouette reads clean at 16:9 distance.

export const UNIT = 150;

export const RIG = {
  // Wide enough for both arms fully spread: shoulders at 310 ± 80 plus a
  // 2-unit arm reaches 590 from the spine, so the box is 620. A box that only
  // fits the body means the one gesture that needs the whole wingspan is the
  // one that overflows into whatever the composition put beside him.
  box: { w: 620, h: 935 },

  head: { x: 310, y: 105, r: 75 },
  /** Where the neck meets the shoulders. The spine hangs from here. */
  neck: { x: 310, y: 187 },
  /** The shoulder line, at the top of the torso. */
  chest: { x: 310, y: 245 },
  /** The pelvis, at the bottom of the torso. */
  hip: { x: 310, y: 539 },
  shoulderSpan: 80,

  // Fingertips reach just past the hip with the arm hanging (shoulder 245 +
  // arm 300 = 545), which is where they reach on a person. Longer than that
  // and the resting pose looks simian; shorter and every raised gesture runs
  // out of arm before it clears the head.
  arm: { upper: 152, fore: 148 },
  // Legs are near-full extension when standing; the slack between hip height
  // and (thigh + shin) is what lets the knees bend without popping.
  leg: { thigh: 176, shin: 172 },

  /** Where the feet stand. */
  ground: 890,

  /** Face, in head-local coordinates measured from the head centre. */
  face: {
    eye: { dx: 30, dy: -22, r: 8.5 },
    brow: { dx: 30, dy: -46, w: 26 },
    // Big. A mouth sized like a real one disappears at phone scale, and the
    // whole point of the lip sync is that it is legible in a thumbnail-sized
    // player. The open shapes come within a few units of the chin, which is
    // deliberate — that is where the ceiling should be.
    mouth: { dy: 30, w: 88, h: 62 },
  },
} as const;

/**
 * The stroke system. One source of truth so the character is drawn identically
 * in every scene: the body stroke, the slightly lighter face stroke (the
 * subtle hierarchy the whole look rests on), the round caps and joins, and the
 * few sizes that turn joints into limbs.
 *
 * All values are in rig units; the character scales the whole box, so these
 * stay proportionally correct at any output size.
 */
export const STICKMAN_STYLE = {
  /** Main body ink, including the head outline. */
  stroke: 7,
  /** A hair lighter than the body so the face sits behind it in hierarchy. */
  faceStroke: 5.4,
  /** Arms and legs — nearly the body weight, read as one system. */
  limbStroke: 6.6,
  /** The shoulder line across the torso reads lighter than the spine. */
  shoulderStroke: 6.2,

  lineCap: "round" as const,
  lineJoin: "round" as const,

  /** Radius of the hand blob. */
  handSize: 12,
  /** Length of a foot, toe to heel. */
  footSize: 26,

  /** Deterministic hand-drawn wobble amplitude. Small: a shimmer, not a shake. */
  wobble: 1.2,

  /** Contact shadow under the feet. */
  shadow: { opacity: 0.11, ry: 12 },
} as const;
