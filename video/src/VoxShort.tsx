// The vox composition. Same job as FinanceShort — read script.json, stage it —
// with a second vocabulary. No episode-specific JSX lives here either.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import script from "./script.json";
import voice from "./voice.json";
import { Soundtrack, usePlanCamera } from "./staging";
import { theme } from "./theme";
import { HAS_BED, hasFootage, ImageBed, LiftCaption, PaperBG } from "./vox/elements";
import { ARCHIVAL, VOX_MODULES, VoxBeat } from "./vox/scenes";
import { FrameZeroCard, HOOK_WORDS } from "./Hook";
import { IMPACT_AT } from "./plan";

const vox = theme.vox;

const BEATS: VoxBeat[] = script.beats;

/** The first beat with a recorded take is the one the frame-zero card overlays.
 *  Its opening words are on the card already, so the module underneath must not
 *  type them a second time — see the note at the top of Hook.tsx. */
const HOOK_BEAT = voice.beats.find((b) => b.words.length > 0)?.n ?? -1;

/** Frames the outgoing page overlaps the incoming one. Short enough to still
 *  read as a cut, long enough that the eye is carried rather than jolted. */
const TURN = 9;

/**
 * A page turn. The outgoing beat lifts and clears while the incoming one rises
 * into its place — the two overlap, so at no point is the frame empty.
 *
 * The move is small on purpose. A page that slides its full height reads as a
 * slideshow transition; a page that shifts a few percent reads as paper being
 * moved, which is the only thing this engine is pretending to be.
 */
const Turn: React.FC<{
  dur: number;
  last: boolean;
  opaque: boolean;
  children: React.ReactNode;
}> = ({ dur, last, opaque, children }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const io = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const soft = Easing.bezier(0.22, 1, 0.36, 1);

  const enter = interpolate(frame, [0, TURN], [0, 1], { ...io, easing: soft });
  // The exit runs in the held-open window *past* `dur`, not in the last frames
  // before it. The next beat's sequence starts at `dur` with enter=0, so an exit
  // that finished at `dur` left both pages invisible on the same frame and every
  // cut flashed to bare paper.
  //
  // The final beat holds: fading the payoff out is throwing away the line the
  // whole video was built to land.
  const exit = last
    ? 0
    : interpolate(frame, [dur, dur + TURN], [0, 1], { ...io, easing: Easing.linear });

  return (
    <AbsoluteFill
      style={{
        opacity: enter * (1 - exit),
        transform: `translateY(${
          (1 - enter) * height * 0.035 - exit * height * 0.025
        }px)`,
      }}
    >
      {/* A module that stages straight onto the page has nothing of its own to
          hide the beat underneath. Without this, a text beat arriving over an
          archival beat spends the whole turn with footage showing through it.
          The background is fixed paper — the bed never replaces it, so a page
          always draws its own ground. With a bed, the ground is the paper and
          the plates are already behind everything, so the page needs nothing. */}
      {opaque || HAS_BED ? null : <PaperBG />}
      {children}
    </AbsoluteFill>
  );
};

/** The bed swells into the beat the director marked as the payoff, rather than
 *  onto the last frame by default — in a Short the last frame is usually the
 *  ask, and swelling into an ask is asking twice. */
const IMPACT = IMPACT_AT || (BEATS.length ? BEATS[BEATS.length - 1].start : 0);

/**
 * Narration on the page. Over the modules that darken the frame it sits on a
 * paper card — black-on-white over footage is the Vox caption, and it's the
 * only thing that stays legible on an archival clip.
 */
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const take = voice.beats.find(
    (b) =>
      b.words.length > 0 &&
      t >= b.start &&
      t < b.start + b.words[b.words.length - 1].end,
  );
  if (!take) return null;
  const beat = BEATS.find((b) => b.n === take.n);
  if (!beat) return null;
  // The card exists to survive a dark background, and the background is only
  // dark when a clip actually downloaded — the bed is foreground now, over
  // fixed paper, so it never darkens the caption's ground.
  const dark = ARCHIVAL.has(beat.module) && hasFootage(beat.n);

  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.075,
        right: width * 0.075,
        // theme.safe.bottom is the strip the phone takes for the title, the
        // handle and the action rail. The caption used to sit at 10% of the
        // height — 192px up, well inside that strip — so on an actual Shorts
        // player the narration was behind the like button. It now sits on top
        // of the reserved area, not in it.
        bottom: theme.safe.bottom * (height / 1920),
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={
          dark
            ? {
                background: vox.paper,
                padding: `${width * 0.022}px ${width * 0.032}px`,
                boxShadow: `0 ${width * 0.014}px ${width * 0.04}px rgba(0,0,0,.35)`,
              }
            : undefined
        }
      >
        <LiftCaption
          words={take.words}
          t={t - take.start}
          color={vox.ink}
          size={width * 0.062}
          perLine={4}
        />
      </div>
    </div>
  );
};

export const VoxShort: React.FC = () => {
  const { fps } = useVideoConfig();
  // No shake: a shaking page reads as a mistake, not as impact.
  const { scale } = usePlanCamera(IMPACT, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: vox.paper }}>
      {/* The background is fixed. It never changes for the whole film. */}
      <PaperBG />
      {/* Foreground b-roll: transparent plates slide in over the fixed paper,
          timed to the voice via the shot windows. The pages and their text
          draw above the plates, so the words always win the frame. */}
      {HAS_BED ? <ImageBed /> : null}
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {BEATS.map((beat, i) => {
          const Scene = VOX_MODULES[beat.module] ?? VOX_MODULES.kinetic;
          const dur = Math.round((beat.end - beat.start) * fps);
          const take = voice.beats.find((b) => b.n === beat.n);
          const last = i === BEATS.length - 1;
          // The card is holding the opening words; this beat picks up after them.
          const spoken = take ? take.words : [];
          const words =
            beat.n === HOOK_BEAT && HOOK_WORDS.length ? spoken.slice(HOOK_WORDS.length) : spoken;
          // The beat is held open past its own end so its exit overlaps the next
          // beat's entrance. Modules still animate against `dur`, so nothing
          // downstream has to know the turn exists.
          return (
            <Sequence
              key={beat.n}
              name={`${beat.n}. ${beat.name}`}
              from={Math.round(beat.start * fps)}
              durationInFrames={last ? dur : dur + TURN}
            >
              <Turn dur={dur} last={last} opaque={ARCHIVAL.has(beat.module)}>
                <Scene dur={dur} beat={beat} words={words} />
              </Turn>
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <Captions />

      {/* The complete hook, on frame one, above everything. The page keeps
          assembling underneath during the hold, so the kinetic reveal is
          already done by the time the card clears. */}
      <FrameZeroCard />

      <Soundtrack impact={IMPACT} />
    </AbsoluteFill>
  );
};
