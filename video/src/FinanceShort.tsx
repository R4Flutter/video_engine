// The finance composition. Long-form finance episodes use the documentary cold-open
// treatment; shorter finance episodes keep the legacy frame-zero hook.
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Backdrop } from "./elements";
import { CaptionTrack, TextTrack } from "./Overlays";
import script from "./script.json";
import voice from "./voice.json";
import { MODULES } from "./scenes";
import { impactAt, Soundtrack, usePlanCamera } from "./staging";
import { FrameZeroCard } from "./Hook";
import { LongFormColdOpen } from "./LongFormColdOpen";

const IMPACT = impactAt("payoff", /million/i);

export const FinanceShort: React.FC = () => {
  const { fps } = useVideoConfig();
  const total = script.durationInSeconds;
  const isLongForm = total >= 120;
  const { scale, shake } = usePlanCamera(IMPACT);

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

      {/* The long-form cold open owns Beat 1 typography. The legacy text track
          is intentionally disabled for long-form so two independent systems
          cannot place contradictory text over the same narration. */}
      <TextTrack cues={isLongForm ? [] : script.texts} total={total} />
      <CaptionTrack
        beats={voice.beats}
        skip={(n) => n === 1 || script.beats.find((b) => b.n === n)?.module === "outro"}
      />

      {isLongForm ? <LongFormColdOpen /> : <FrameZeroCard />}

      <Soundtrack impact={IMPACT} longForm={isLongForm} />
    </AbsoluteFill>
  );
};
