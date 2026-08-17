// Dedicated 16:9 documentary renderer for the long-form engine.
// The legacy Vox composition is intentionally not exposed by the project.
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import script from "./script.json";
import voice from "./voice.json";
import { Soundtrack, usePlanCamera } from "./staging";
import { theme } from "./theme";
import { ARCHIVAL, VOX_MODULES } from "./vox/scenes";
import { HAS_BED, hasFootage, ArchivalBG, ImageBed, LiftCaption, PaperBG } from "./vox/elements";
import { FrameZeroCard, HOOK_WORDS } from "./Hook";
import { IMPACT_AT } from "./plan";

type DocumentaryBeat = (typeof script.beats)[number];
const visual = theme.vox;
const BEATS: DocumentaryBeat[] = script.beats;
const TURN = 9;
const IMPACT = IMPACT_AT || (BEATS.length ? BEATS[BEATS.length - 1].start : 0);
const HOOK_BEAT = voice.beats.find((b) => b.words.length > 0)?.n ?? -1;

const Turn: React.FC<{ dur: number; last: boolean; opaque: boolean; beatNo: number; stock: boolean; children: React.ReactNode }> = ({ dur, last, opaque, beatNo, stock, children }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const io = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const soft = Easing.bezier(0.22, 1, 0.36, 1);
  const enter = interpolate(frame, [0, TURN], [0, 1], { ...io, easing: soft });
  const exit = last ? 0 : interpolate(frame, [dur, dur + TURN], [0, 1], { ...io, easing: Easing.linear });
  const footageProgress = interpolate(frame, [0, Math.max(1, dur)], [0, 1], io);

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit), transform: `translateY(${(1 - enter) * height * 0.035 - exit * height * 0.025}px)` }}>
      {stock ? <ArchivalBG beat={beatNo} progress={footageProgress} /> : null}
      {opaque || HAS_BED || stock ? null : <PaperBG />}
      {children}
    </AbsoluteFill>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const take = voice.beats.find((b) => b.words.length > 0 && t >= b.start && t < b.start + b.words[b.words.length - 1].end);
  if (!take) return null;
  const beat = BEATS.find((b) => b.n === take.n);
  if (!beat) return null;
  const dark = (ARCHIVAL.has(beat.module) || hasFootage(beat.n)) && hasFootage(beat.n);

  return (
    <div style={{ position: "absolute", left: width * 0.075, right: width * 0.075, bottom: height * 0.075, display: "flex", justifyContent: "center" }}>
      <div style={dark ? { background: visual.paper, padding: `${width * 0.015}px ${width * 0.022}px`, boxShadow: `0 ${width * 0.01}px ${width * 0.03}px rgba(0,0,0,.28)` } : undefined}>
        <LiftCaption words={take.words} t={t - take.start} color={visual.ink} size={width * 0.032} perLine={6} />
      </div>
    </div>
  );
};

export const LongFormDocumentary: React.FC = () => {
  const { fps } = useVideoConfig();
  const { scale } = usePlanCamera(IMPACT, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: visual.paper }}>
      <PaperBG />
      {HAS_BED ? <ImageBed /> : null}
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {BEATS.map((beat, i) => {
          const Scene = VOX_MODULES[beat.module] ?? VOX_MODULES.kinetic;
          const dur = Math.round((beat.end - beat.start) * fps);
          const take = voice.beats.find((b) => b.n === beat.n);
          const last = i === BEATS.length - 1;
          const spoken = take ? take.words : [];
          const words = beat.n === HOOK_BEAT && HOOK_WORDS.length ? spoken.slice(HOOK_WORDS.length) : spoken;
          const stock = hasFootage(beat.n);

          return (
            <Sequence key={beat.n} name={`${beat.n}. ${beat.name}`} from={Math.round(beat.start * fps)} durationInFrames={last ? dur : dur + TURN}>
              <Turn dur={dur} last={last} opaque={ARCHIVAL.has(beat.module)} beatNo={beat.n} stock={stock}>
                <Scene dur={dur} beat={beat as any} words={words as any} />
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
