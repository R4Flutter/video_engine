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
import {
  ARCHIVAL,
  VOX_MODULES,
  VoxBeat,
} from "./vox/scenes";
import {
  HAS_BED,
  hasFootage,
  ArchivalBG,
  ImageBed,
  LiftCaption,
  PaperBG,
} from "./vox/elements";
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
 */
const Turn: React.FC<{
  dur: number;
  last: boolean;
  opaque: boolean;
  beatNo: number;
  stock: boolean;
  children: React.ReactNode;
}> = ({ dur, last, opaque, beatNo, stock, children }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const io = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const soft = Easing.bezier(0.22, 1, 0.36, 1);

  const enter = interpolate(frame, [0, TURN], [0, 1], { ...io, easing: soft });
  const exit = last
    ? 0
    : interpolate(frame, [dur, dur + TURN], [0, 1], { ...io, easing: Easing.linear });

  const footageProgress = interpolate(frame, [0, Math.max(1, dur)], [0, 1], io);

  return (
    <AbsoluteFill
      style={{
        opacity: enter * (1 - exit),
        transform: `translateY(${(1 - enter) * height * 0.035 - exit * height * 0.025}px)`,
      }}
    >
      {/* A requirement-driven stock clip is now a legitimate background for
          any authored module, not only the old archival modules. This means a
          timeline/stat/icon beat can keep its designed foreground while the
          physical world described by the requirement plays underneath it. */}
      {stock ? <ArchivalBG beat={beatNo} progress={footageProgress} /> : null}

      {/* When there is no stock clip, retain the original paper ground. When a
          clip exists, the clip owns the ground so PaperBG cannot cover it. */}
      {opaque || HAS_BED || stock ? null : <PaperBG />}
      {children}
    </AbsoluteFill>
  );
};

const IMPACT = IMPACT_AT || (BEATS.length ? BEATS[BEATS.length - 1].start : 0);

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
  const dark = (ARCHIVAL.has(beat.module) || hasFootage(beat.n)) && hasFootage(beat.n);

  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.075,
        right: width * 0.075,
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
  const { scale } = usePlanCamera(IMPACT, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: vox.paper }}>
      <PaperBG />
      {HAS_BED ? <ImageBed /> : null}
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {BEATS.map((beat, i) => {
          const Scene = VOX_MODULES[beat.module] ?? VOX_MODULES.kinetic;
          const dur = Math.round((beat.end - beat.start) * fps);
          const take = voice.beats.find((b) => b.n === beat.n);
          const last = i === BEATS.length - 1;
          const spoken = take ? take.words : [];
          const words =
            beat.n === HOOK_BEAT && HOOK_WORDS.length ? spoken.slice(HOOK_WORDS.length) : spoken;
          const stock = hasFootage(beat.n);

          return (
            <Sequence
              key={beat.n}
              name={`${beat.n}. ${beat.name}`}
              from={Math.round(beat.start * fps)}
              durationInFrames={last ? dur : dur + TURN}
            >
              <Turn
                dur={dur}
                last={last}
                opaque={ARCHIVAL.has(beat.module)}
                beatNo={beat.n}
                stock={stock}
              >
                <Scene dur={dur} beat={beat} words={words} />
              </Turn>
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <Captions />
      <FrameZeroCard />
      <Soundtrack impact={IMPACT} />
    </AbsoluteFill>
  );
};
