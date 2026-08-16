import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import director from "./director-plan.json";
import voice from "./voice.json";
import { LONGFORM_MODULES, StrictFallback } from "./LongFormScenes";
import { LongFormColdOpen } from "./LongFormColdOpen";

const isLongFormPlan = Number(director?.project?.durationInSeconds || 0) >= 120;

export const FinanceLong: React.FC = () => {
  const { fps } = useVideoConfig();
  if (!isLongFormPlan) {
    return <AbsoluteFill style={{ background: "#F4F1EA", color: "#171714", justifyContent: "center", alignItems: "center", fontFamily: "Arial", fontSize: 44 }}>FinanceLong requires a 120s+ director plan.</AbsoluteFill>;
  }

  const beats = director.beats ?? [];
  return (
    <AbsoluteFill style={{ background: "#F4F1EA" }}>
      {beats.map((beat: any) => {
        const Scene = LONGFORM_MODULES[String(beat?.visual?.module || "")] ?? StrictFallback;
        const from = Math.round(Number(beat.start) * fps);
        const dur = Math.max(1, Math.round((Number(beat.end) - Number(beat.start)) * fps));
        return <Sequence key={beat.n} name={`LONGFORM ${beat.n}. ${beat.name || ""}`} from={from} durationInFrames={dur}><Scene beat={beat} /></Sequence>;
      })}

      <LongFormColdOpen />

      {voice.beats.filter((b: any) => b.file && b.words?.length).map((b: any) => (
        <Sequence key={`vo-${b.n}`} from={Math.round(Number(b.start) * fps)}>
          <Audio src={staticFile(`audio/${b.file}`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
