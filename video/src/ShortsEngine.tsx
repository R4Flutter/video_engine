import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import manifest from "./shorts-manifest.json";
import { LONGFORM_MODULES, StrictFallback } from "./LongFormScenes";

type ShortBeat = { n: number; start?: string | number; end?: string | number; module?: string; text?: string; reveal?: string; payoff?: string; audio?: string; words?: { w: string; start: number; end: number }[]; visual?: { assetPath?: string; asset?: string; footage?: string }; typography?: { text?: string }; narrative?: { reveal?: string } };
type Short = { duration?: string | number; beats?: ShortBeat[] };
const SHORTS = (manifest as { shorts?: Short[] }).shorts ?? [];

type Word = { w: string; start: number; end: number };

function Caption({ words }: { words: Word[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = words.filter((w) => t >= w.start && t < w.end).slice(-1)[0];
  if (!active) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 150, display: "flex", justifyContent: "center", zIndex: 30, pointerEvents: "none" }}>
      <div style={{ background: "rgba(0,0,0,.72)", borderRadius: 16, padding: "14px 22px", color: "white", fontSize: 54, fontWeight: 800, lineHeight: 1.05, textAlign: "center", textShadow: "0 2px 10px rgba(0,0,0,.5)" }}>
        {active.w}
      </div>
    </div>
  );
}

function OneShort({ index }: { index: number }) {
  const short = SHORTS[index];
  const { fps } = useVideoConfig();
  if (!short) return <AbsoluteFill style={{ background: "#080808" }} />;
  const beats = short.beats ?? [];
  const allWords = beats.flatMap((b) => b.words ?? []);

  return (
    <AbsoluteFill style={{ background: "#080808", overflow: "hidden" }}>
      {beats.map((beat) => {
        const Scene = LONGFORM_MODULES[beat.module ?? "stat"] ?? StrictFallback;
        const from = Math.round(Number(beat.start) * fps);
        const dur = Math.max(1, Math.round((Number(beat.end) - Number(beat.start)) * fps));
        const sceneBeat = {
          ...beat,
          start: Number(beat.start),
          end: Number(beat.end),
          visual: {
            ...(beat.visual ?? {}),
            module: beat.module,
            assetPath: beat.visual?.assetPath ?? beat.visual?.asset ?? beat.visual?.footage ?? undefined,
          },
          typography: beat.typography ?? { text: beat.text ?? beat.reveal ?? "" },
          narrative: beat.narrative ?? { reveal: beat.reveal ?? beat.payoff ?? "" },
        };
        return (
          <Sequence key={`${index}-${beat.n}`} from={from} durationInFrames={dur}>
            <AbsoluteFill>
              <Scene beat={sceneBeat} />
              {beat.audio ? <Audio src={staticFile(beat.audio)} /> : null}
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <Caption words={allWords} />
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none", background: "linear-gradient(180deg, rgba(0,0,0,.08), transparent 25%, transparent 72%, rgba(0,0,0,.35))" }} />
    </AbsoluteFill>
  );
}

export const ShortsEngine: React.FC<{ index?: number }> = ({ index = 0 }) => <OneShort index={index} />;
