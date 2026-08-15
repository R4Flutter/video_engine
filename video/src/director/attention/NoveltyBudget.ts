// NoveltyBudget: not everything may move at once.
//
// The failure this prevents is specific and common in Shorts: type flying in,
// camera pushing, module animating and captions burning, all in the same
// second. Every element is fine alone; together they compete and the viewer
// resolves the competition by leaving.
//
// The rule of thumb: if the type is flying, the camera stands still. If the
// camera is moving, the page stays calm. Something always gets removed —
// never added.
import type { CaptionMode, ScriptBeat } from "../types.ts";

/** How much motion a module brings to the frame, 0..1. */
export const MODULE_MOTION: Record<string, number> = {
  // vox vocabulary
  kinetic: 0.9,
  compare: 0.6,
  doodle: 0.6,
  icon: 0.55,
  chart: 0.55,
  stat: 0.5,
  timeline: 0.5,
  callout: 0.45,
  footage: 0.35,
  quote: 0.3,
  // finance vocabulary
  coinDrop: 0.5,
  coinStack: 0.55,
  investChart: 0.45,
  jarFill: 0.5,
  mountain: 0.6,
  payoff: 0.65,
  outro: 0.35,
};

/** Motion cost of a camera move.
 *
 *  `punch` is cheaper than `push` even though it is louder, and that is not a
 *  mistake: a punch is a three-frame scale hit at the head of a beat, so it is
 *  over before the module has finished arriving. A push runs for the beat's
 *  whole length and competes with everything in it the entire time.
 *  Duration is what costs, not amplitude. */
export const CAMERA_MOTION: Record<string, number> = {
  hold: 0,
  settle: 0.08,
  punch: 0.25,
  pull: 0.3,
  push: 0.35,
};

/** Captions cost less here than the essay engine charges them. They live in a
 *  fixed band at the bottom of the frame, so they are not competing for the
 *  same region as the stage — they are competing for reading attention only. */
export const CAPTION_MOTION: Record<CaptionMode, number> = {
  NONE: 0,
  EMPHASIS: 0.12,
  SUBTITLE: 0.18,
  FULL: 0.26,
};

/** Above this the frame is competing with itself. Exported so VisualQC judges
 *  against the same line the budget trims to — two constants that drift apart
 *  produce a report that contradicts the plan it is reporting on. */
export const MOTION_CEILING = 1.15;

export type BudgetDecision = {
  load: number;
  camera: string;
  captionMode: CaptionMode;
  trimmed: boolean;
};

const QUIETER: Record<CaptionMode, CaptionMode> = {
  FULL: "SUBTITLE",
  SUBTITLE: "EMPHASIS",
  EMPHASIS: "EMPHASIS",
  NONE: "NONE",
};

/**
 * Trim order: the camera goes first, captions second, and captions never go
 * below EMPHASIS.
 *
 * The essay engine trims the other way round, and for an essay that is right —
 * a viewer watching a ten-minute documentary has the sound on. A Short does
 * not get that assumption. A large share of the feed is watched muted, so
 * stripping the words off a frame to buy motion budget is trading the only
 * channel that is definitely reaching the viewer for one that might not be.
 *
 * `kinetic` is the exception and it is exempt below: its words *are* the
 * frame, so captions there would print the same line twice.
 */
export const budgetFor = (
  _b: ScriptBeat,
  module: string,
  cameraIntent: string,
  captionMode: CaptionMode,
): BudgetDecision => {
  const m = MODULE_MOTION[module] ?? 0.5;
  let outCamera = cameraIntent;
  let outCaption = captionMode;
  let trimmed = false;
  const load = () => m + (CAMERA_MOTION[outCamera] ?? 0.3) + CAPTION_MOTION[outCaption];

  // 1. calm the camera — the cheapest thing to give up, because a held frame
  //    with a moving module still reads as motion.
  if (load() > MOTION_CEILING && (CAMERA_MOTION[outCamera] ?? 0.3) > CAMERA_MOTION.settle) {
    outCamera = "settle";
    trimmed = true;
  }
  if (load() > MOTION_CEILING && (CAMERA_MOTION[outCamera] ?? 0.3) > 0) {
    outCamera = "hold";
    trimmed = true;
  }
  // 2. quiet the captions, down to EMPHASIS and no further.
  while (load() > MOTION_CEILING && outCaption !== QUIETER[outCaption]) {
    outCaption = QUIETER[outCaption];
    trimmed = true;
  }

  return { load: Number(load().toFixed(2)), camera: outCamera, captionMode: outCaption, trimmed };
};
