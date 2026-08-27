import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import director from "./director-plan.json";
import { LONGFORM_MODULES, StrictFallback, type LongFormBeat } from "./LongFormScenes";
import { LongFormColdOpen, COLD_OPEN_COVER_UNTIL } from "./LongFormColdOpen";
import { impactAt, MagnatesBed, Soundtrack } from "./staging";
import { SceneCamera } from "./SceneCamera";
import { EmphasisCaptions } from "./EmphasisCaptions";
import { CinematicOverlay } from "./CinematicOverlay";
import { LF } from "./longform-theme";

const isLongFormPlan = director?.project?.mode === "LONGFORM_DOCUMENTARY" && director?.renderContract?.schema === "longform-render-1";

const ChapterFlash: React.FC<{ beats: LongFormBeat[] }> = ({ beats }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const boundaries = beats.filter((b, i) => i > 0 && b.chapterId !== beats[i - 1].chapterId);
  const hit = boundaries.find((b) => t >= Number(b.render?.sequence?.fromSeconds ?? b.start ?? 0) && t < Number(b.render?.sequence?.fromSeconds ?? b.start ?? 0) + 2.6);
  if (!hit) return null;
  const at = Number(hit.render?.sequence?.fromSeconds ?? hit.start ?? 0);
  const chap = (director.chapters ?? []).find((c) => c.id === hit.chapterId);
  const title = chap?.title ?? hit.name ?? "CHAPTER";
  const num = String((director.chapters ?? []).findIndex((c) => c.id === hit.chapterId) + 1);
  const inP = Math.min(1, (t - at) / 0.4);
  const outP = Math.max(0, Math.min(1, (at + 2.6 - t) / 0.5));
  const opacity = Math.min(inP, outP);
  const scale = interpolate(inP, [0, 1], [1.06, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, background: "rgba(8,9,12,0.72)" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${scale})` }}>
        <div style={{ fontFamily: LF.font.display, fontWeight: 700, fontSize: 34, letterSpacing: 12, color: LF.color.gold, textTransform: "uppercase" }}>CHAPTER</div>
        <div style={{ fontFamily: LF.font.black, fontWeight: 400, fontSize: Math.min(120, width * 0.09), lineHeight: 1.05, letterSpacing: -2, color: LF.color.text, textAlign: "center", maxWidth: "82%", textTransform: "uppercase" }}>
          <span style={{ color: LF.color.gold, marginRight: 14 }}>{num}.</span>
          {title.replace(/^CHAPTER\s*\d+\s*\/\s*/i, "").replace(/^CHAPTER\s*\d+\s*/i, "")}
        </div>
        <div style={{ marginTop: 26, width: 140, height: 5, background: LF.color.gold, boxShadow: "0 0 24px rgba(212,167,60,0.6)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(212,167,60,0.10) 0%, rgba(8,9,12,0) 70%)" }} />
    </AbsoluteFill>
  );
};

export const FinanceLong: React.FC = () => {
  const { fps } = useVideoConfig();
  if (!isLongFormPlan) return <AbsoluteFill style={{ background: "#F4F1EA", color: "#171714", justifyContent: "center", alignItems: "center", fontFamily: "Arial", fontSize: 44 }}>FinanceLong requires a production long-form render contract.</AbsoluteFill>;
  const beats = director.beats ?? [];
  const impact = impactAt("payoff", /million/i);
  const coldOpenActive = Boolean(director?.coldOpen?.selected);
  return (
    <AbsoluteFill style={{ background: LF.color.bg }}>
      {beats.map((beat: LongFormBeat) => {
        const render = beat.render;
        if (!render?.scene?.module || !render?.sequence) return null;
        const covered = coldOpenActive && Number(render.sequence.fromSeconds) < COLD_OPEN_COVER_UNTIL;
        if (covered) return null;
        const Scene = LONGFORM_MODULES[String(render.scene.module)] ?? StrictFallback;
        const from = Math.round(Number(render.sequence.fromSeconds) * fps);
        const dur = Math.max(1, Math.round(Number(render.sequence.durationSeconds) * fps));
        return (
          <Sequence key={beat.n} name={`LONGFORM ${beat.n}. ${beat.name || ""}`} from={from} durationInFrames={dur}>
            <SceneCamera beat={beat}>
              <Scene beat={beat} />
              <EmphasisCaptions beatN={beat.n} fromSeconds={Number(render.sequence.fromSeconds)} />
            </SceneCamera>
          </Sequence>
        );
      })}
      <LongFormColdOpen />
      <ChapterFlash beats={beats} />
      <MagnatesBed impact={impact} />
      <Soundtrack impact={impact} longForm />
      <CinematicOverlay />
    </AbsoluteFill>
  );
};