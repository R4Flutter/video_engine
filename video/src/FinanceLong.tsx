import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import director from "./director-plan.json";
import { LONGFORM_MODULES, StrictFallback, type LongFormBeat } from "./LongFormScenes";
import { LongFormColdOpen } from "./LongFormColdOpen";
import { impactAt, Soundtrack } from "./staging";

const isLongFormPlan = director?.project?.mode === "LONGFORM_DOCUMENTARY" && director?.renderContract?.schema === "longform-render-1";

export const FinanceLong: React.FC = () => {
  const { fps } = useVideoConfig();
  if (!isLongFormPlan) return <AbsoluteFill style={{ background: "#F4F1EA", color: "#171714", justifyContent: "center", alignItems: "center", fontFamily: "Arial", fontSize: 44 }}>FinanceLong requires a production long-form render contract.</AbsoluteFill>;
  const beats = director.beats ?? [];
  const impact = impactAt("payoff", /million/i);
  return (
    <AbsoluteFill style={{ background: "#F4F1EA" }}>
      {beats.map((beat: LongFormBeat) => {
        const render = beat.render;
        if (!render?.scene?.module || !render?.sequence) return null;
        const Scene = LONGFORM_MODULES[String(render.scene.module)] ?? StrictFallback;
        const from = Math.round(Number(render.sequence.fromSeconds) * fps);
        const dur = Math.max(1, Math.round(Number(render.sequence.durationSeconds) * fps));
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
