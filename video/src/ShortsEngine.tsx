import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import manifest from "./shorts-manifest.json";
import { MODULES } from "./scenes";

const SHORTS = manifest.shorts ?? [];

function Caption({ words }: { words: Array<{ w: string; start: number; end: number }> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = words.filter((w) => t >= w.start && t < w.end).slice(-1)[0];
  if (!active) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 150, display: "flex", justifyContent: "center", zIndex: 30 }}>
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
        const Scene = MODULES[beat.module] ?? MODULES.footage ?? MODULES.kinetic;
        const from = Math.round(beat.start * fps);
        const dur = Math.max(1, Math.round((beat.end - beat.start) * fps));
        return (
          <Sequence key={`${index}-${beat.n}`} from={from} durationInFrames={dur}>
            <AbsoluteFill>
              <Scene dur={dur} />
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
