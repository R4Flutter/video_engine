// Finance composition: visual stage moves, editorial overlays stay readable.
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Backdrop } from "./elements";
import { CaptionTrack, TextTrack } from "./Overlays";
import { Soundtrack, usePlanCamera } from "./staging";
import { FrameZeroCard } from "./Hook";
import { MODULES } from "./scenes";
import script from "./script.json";
import voice from "./voice.json";

const IMPACT = (() => {
  const beat = script.beats.find((b) => b.purpose === "payoff" || b.module === "payoff");
  return beat?.start ?? (script.beats.length ? script.beats[script.beats.length-1].start : 0);
})();

export const FinanceShort: React.FC = () => {
  const { fps } = useVideoConfig();
  const camera = usePlanCamera(IMPACT);
  const total = script.durationInSeconds;

  return (
    <AbsoluteFill style={{ backgroundColor: "#06181C" }}>
      <Backdrop />
      <AbsoluteFill style={{ transform: camera.transform, transformOrigin: "50% 50%" }}>
        {script.beats.map((beat) => {
          const Scene = MODULES[beat.module] ?? MODULES.coinDrop;
          const dur = Math.round((beat.end - beat.start) * fps);
          return (
            <Sequence
              key={beat.n}
              name={`${beat.n}. ${beat.name}`}
              from={Math.round(beat.start * fps)}
              durationInFrames={dur}
            >
              <Scene dur={dur} beat={beat} />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      {/* Reading layer never participates in camera movement. */}
      <TextTrack cues={script.texts} total={total} />
      <CaptionTrack
        beats={voice.beats}
        skip={(n) => n === 1 || script.beats.find((b) => b.n === n)?.module === "outro"}
      />
      <FrameZeroCard />
      <Soundtrack impact={IMPACT} />
    </AbsoluteFill>
  );
};
