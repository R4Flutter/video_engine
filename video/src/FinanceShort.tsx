// The composition. It reads script.json and stages it — no episode-specific
// JSX lives here, so a new script.md renders without touching this file.
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Backdrop } from "./elements";
import { CaptionTrack, TextTrack } from "./Overlays";
import script from "./script.json";
import voice from "./voice.json";
import { MODULES } from "./scenes";
import { impactAt, Soundtrack, usePlanCamera } from "./staging";
import { FrameZeroCard } from "./Hook";

/** The gold flash and the shake are cued off the spoken word, not off a frame
 *  number, so they stay on the beat when the read changes. */
const IMPACT = impactAt("payoff", /million/i);

export const FinanceShort: React.FC = () => {
  const { fps } = useVideoConfig();
  // The camera comes from the director plan now: intent per beat, and beat one
  // holds. The old per-module table lived here and could disagree with the
  // plan, which meant two places to change one decision.
  const { scale, shake } = usePlanCamera(IMPACT);
  const total = script.durationInSeconds;

  return (
    <AbsoluteFill style={{ backgroundColor: "#06181C" }}>
      <Backdrop />
      <AbsoluteFill
        style={{ transform: `scale(${scale}) translate(${shake}px, ${shake * 0.5}px)` }}
      >
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
              <Scene dur={dur} />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <TextTrack cues={script.texts} total={total} />
      <CaptionTrack
        beats={voice.beats}
        skip={(n) => n === 1 || script.beats.find((b) => b.n === n)?.module === "outro"}
      />

      {/* Above everything: the complete hook on frame one. It lifts once it
          has been read, and the stage has been animating underneath the whole
          time — so nothing is paused and nothing is lost. */}
      <FrameZeroCard />

      <Soundtrack impact={IMPACT} />
    </AbsoluteFill>
  );
};
