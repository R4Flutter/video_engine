import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import director from "./director-plan.json";
import voice from "./voice.json";
import { DirectedScene } from "./LongFormScenes";
import { LongFormColdOpen } from "./LongFormColdOpen";
import { impactAt, Soundtrack } from "./staging";
import { theme } from "./theme";

type Word = { w: string; start: number; end: number };
const HOOK_DELAY = 3.5;
const beats = director.beats ?? [];
const voiceBeats = (voice.beats ?? []) as { n: number; start: number; words: Word[] }[];

const makeGroups = (words: Word[], size: number) => {
  const groups: Word[][] = [];
  for (const word of words) {
    const last = groups[groups.length - 1];
    if (!last || last.length >= size || /[.!?,]$/.test(last[last.length - 1].w)) groups.push([word]);
    else last.push(word);
  }
  return groups;
};

const LongFormCaptions: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const beat = beats.find((b: any) => t >= Number(b.start) && t < Number(b.end) && String(b?.visual?.captionMode || "SUBTITLE") !== "NONE");
  if (!beat) return null;
  const vb = voiceBeats.find((x) => x.n === beat.n); if (!vb?.words?.length) return null;
  const shift = vb.n === 1 ? HOOK_DELAY : 0; const local = t - shift - Number(vb.start || 0);
  const mode = String(beat?.visual?.captionMode || "SUBTITLE"); const groups = makeGroups(vb.words, mode === "EMPHASIS" ? 4 : 8);
  const group = groups.find((g) => local >= g[0].start && local < g[g.length - 1].end); if (!group) return null;
  return <div style={{ position: "absolute", left: "10%", right: "10%", bottom: "6.5%", display: "flex", justifyContent: "center", zIndex: 40, pointerEvents: "none" }}><div style={{ maxWidth: "82%", textAlign: "center", fontFamily: theme.font, fontWeight: 800, fontSize: mode === "EMPHASIS" ? 38 : 30, lineHeight: 1.15, color: "white", textShadow: "0 4px 18px rgba(0,0,0,.92)", letterSpacing: "-0.01em" }}>{group.map((word, i) => <span key={`${word.w}-${i}`} style={{ color: local >= word.start ? theme.color.gold : "rgba(255,255,255,.88)", margin: "0 4px" }}>{word.w}</span>)}</div></div>;
};

const isLongFormPlan = Number(director?.project?.durationInSeconds || 0) >= 120;

export const FinanceLong: React.FC = () => {
  const { fps } = useVideoConfig();
  if (!isLongFormPlan) return <AbsoluteFill style={{ background: theme.vox.paper, color: theme.vox.ink, justifyContent: "center", alignItems: "center", fontFamily: theme.vox.font, fontSize: 44 }}>FinanceLong requires a 120s+ director plan.</AbsoluteFill>;
  const impact = impactAt("payoff", /million/i);
  return <AbsoluteFill style={{ background: theme.vox.paper }}>
    {beats.map((beat: any) => {
      const from = Math.round(Number(beat.start) * fps); const dur = Math.max(1, Math.round((Number(beat.end) - Number(beat.start)) * fps));
      return <Sequence key={beat.n} name={`LONGFORM ${beat.n}. ${beat.name || ""}`} from={from} durationInFrames={dur}><DirectedScene beat={beat} /></Sequence>;
    })}
    <LongFormCaptions />
    <LongFormColdOpen />
    <Soundtrack impact={impact} longForm />
  </AbsoluteFill>;
};
