import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import director from "./director-plan.json";
import { LONGFORM_MODULES, StrictFallback } from "./LongFormScenes";
import { LongFormColdOpen } from "./LongFormColdOpen";
import { impactAt, Soundtrack } from "./staging";

const isLongFormPlan = Number(director?.project?.durationInSeconds || 0) >= 120;

export const FinanceLong: React.FC = () => {
  const { fps } = useVideoConfig();
  if (!isLongFormPlan) return <AbsoluteFill style={{ background: "#F4F1EA", color: "#171714", justifyContent: "center", alignItems: "center", fontFamily: "Arial", fontSize: 44 }}>FinanceLong requires a 120s+ director plan.</AbsoluteFill>;

  const beats = director.beats ?? [];
  const impact = impactAt("payoff", /million/i);

  return (
    <AbsoluteFill style={{ background: "#F4F1EA" }}>
      {beats.map((beat: any) => {
        const render = beat.render;
        const module = String(render?.scene?.module || beat?.visual?.module || "");
        const Scene = LONGFORM_MODULES[module] ?? StrictFallback;
        const from = Math.round(Number(render?.sequence?.fromSeconds ?? beat.start) * fps);
        const dur = Math.max(1, Math.round(Number(render?.sequence?.durationSeconds ?? (Number(beat.end) - Number(beat.start))) * fps));
        return (
          <Sequence key={beat.n} name={`LONGFORM ${beat.n}. ${beat.name || ""}`} from={from} durationInFrames={dur}>
            <Scene beat={beat} />
          </Sequence>
        );
      })}
      <LongFormColdOpen />
      <Soundtrack impact={impact} longForm />
    </AbsoluteFill>
  );
};
