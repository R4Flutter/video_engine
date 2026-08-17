import React from "react";
import { AbsoluteFill, Img, Video, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { mediaUrl, resolveAsset } from "./AssetResolver";

export type LongFormBeat = any;
const C = { bg: theme.color.ink, paper: theme.vox.paper, ink: theme.vox.ink, muted: theme.vox.muted, accent: theme.vox.accent, line: theme.vox.rule };

const textOf = (b: LongFormBeat) => String(b?.typography?.text || b?.narrative?.reveal || b?.narrative?.question || b?.name || "").trim();
const moduleOf = (b: LongFormBeat) => String(b?.visual?.module || "evidence");

const Media: React.FC<{ beat: LongFormBeat; fit?: "cover" | "contain"; opacity?: number }> = ({ beat, fit = "contain", opacity = 1 }) => {
  const asset = resolveAsset(beat); const src = mediaUrl(asset); if (!src) return null;
  const style = { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: fit, opacity };
  return asset?.kind === "video" ? <Video src={staticFile(src)} muted loop startFrom={0} style={style} /> : <Img src={staticFile(src)} style={style} />;
};

const Label: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light = false }) => <div style={{ fontFamily: theme.vox.font, fontSize: 18, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: light ? "rgba(255,255,255,.72)" : C.muted }}>{children}</div>;

const Statement: React.FC<{ beat: LongFormBeat; light?: boolean }> = ({ beat, light = false }) => {
  const value = textOf(beat); const emph = new Set((beat?.typography?.emphasisWords ?? []).map((x: unknown) => String(x).toLowerCase()));
  const parts = value.split(/(\$[\d,.]+[kMB]?|₹[\d,.]+|\d+(?:\.\d+)?%?|\b(?:NOT|NEVER|NOTHING|EMPTY|BREAKAGE|ILIAD)\b)/gi);
  return <div style={{ maxWidth: "84%", fontFamily: theme.vox.font, fontWeight: 900, fontSize: value.length > 40 ? 60 : value.length > 26 ? 78 : 104, lineHeight: .95, letterSpacing: "-0.04em", color: light ? "white" : C.ink }}>{parts.map((p: string, i: number) => { const hit = emph.has(p.toLowerCase()) || /^\$|^₹|^\d/.test(p) || /^(NOT|NEVER|NOTHING|EMPTY|BREAKAGE|ILIAD)$/i.test(p); return <span key={i} style={{ color: hit ? theme.color.gold : undefined }}>{p}</span>; })}</div>;
};

const SceneFrame: React.FC<{ beat: LongFormBeat; children: React.ReactNode }> = ({ beat, children }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const total = Math.max(1, Math.round((Number(beat?.end) - Number(beat?.start)) * fps));
  const p = Math.min(1, frame / Math.max(1, total - 1)); const intent = String(beat?.motion?.camera?.intent || "hold");
  const [a, b] = ({ hold: [1, 1], push: [1.01, 1.055], pull: [1.055, 1.01], settle: [1.03, 1], punch: [1, 1.02] } as Record<string, [number, number]>)[intent] || [1, 1];
  const scale = interpolate(p, [0, 1], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const revealMode = String(beat?.motion?.reveal?.mode || beat?.visual?.reveal || "IMMEDIATE");
  const reveal = revealMode === "IMMEDIATE" ? 1 : interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const transition = String(beat?.motion?.transitionIn?.type || "cut");
  return <AbsoluteFill style={{ background: C.paper, overflow: "hidden" }}><div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, opacity: reveal }}>{children}</div>{transition === "page" ? <AbsoluteFill style={{ background: C.paper, transform: `translateX(${(interpolate(frame, [0, 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) - 1) * 100}%)` }} /> : transition === "hold" ? <AbsoluteFill style={{ background: C.bg, opacity: interpolate(frame, [0, 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} /> : null}</AbsoluteFill>;
};

export const FootageScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><AbsoluteFill style={{ background: C.bg }}><Media beat={beat} fit="cover" /><AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.03), rgba(0,0,0,.72))" }} /></AbsoluteFill><div style={{ position: "absolute", left: "7%", right: "7%", bottom: "8%" }}><Label light>{beat?.name || "SCENE"}</Label><div style={{ marginTop: 12, color: "white", fontFamily: theme.vox.font, fontSize: 42, lineHeight: 1.05, fontWeight: 800, maxWidth: "78%" }}>{beat?.narrative?.reveal || ""}</div></div></SceneFrame>;

export const EvidenceScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><div style={{ position: "absolute", inset: "8% 7% 9%" }}><Label>SOURCE / EVIDENCE</Label><div style={{ position: "absolute", left: 0, right: 0, top: "13%", bottom: "15%", background: "white", boxShadow: "0 26px 70px rgba(0,0,0,.16)" }}><Media beat={beat} fit="contain" /></div><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "space-between", gap: 28, alignItems: "flex-end" }}><Statement beat={beat} /><div style={{ width: 250, borderTop: `3px solid ${C.accent}`, paddingTop: 10, fontFamily: theme.vox.font, fontSize: 18, color: C.muted, lineHeight: 1.2 }}>{beat?.narrative?.question || ""}</div></div></div></SceneFrame>;

export const StatScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><div style={{ position: "absolute", inset: "8% 7% 9%" }}><Label>NUMBER / CLAIM</Label><div style={{ position: "absolute", left: 0, right: 0, top: "14%", height: "56%", background: "white", boxShadow: "0 26px 70px rgba(0,0,0,.13)" }}><Media beat={beat} fit="contain" /></div><div style={{ position: "absolute", left: 0, bottom: 0 }}><Statement beat={beat} /></div></div></SceneFrame>;

export const CompareScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><div style={{ position: "absolute", inset: "8% 7% 9%" }}><Label>CONTRADICTION</Label><div style={{ position: "absolute", left: 0, right: 0, top: "14%", bottom: 0, display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 22 }}><div style={{ position: "relative", background: "white", overflow: "hidden", boxShadow: "0 26px 70px rgba(0,0,0,.12)" }}><Media beat={beat} fit="contain" /><div style={{ position: "absolute", left: 16, top: 16, background: "rgba(255,255,255,.92)", padding: "8px 12px", fontFamily: theme.vox.font, fontSize: 15, fontWeight: 800 }}>WHAT IT SHOWS</div></div><div style={{ background: C.bg, padding: "10% 8%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><Statement beat={beat} light /><div style={{ borderTop: `3px solid ${theme.color.gold}`, paddingTop: 14, color: "rgba(255,255,255,.68)", fontFamily: theme.vox.font, fontSize: 20 }}>WHAT IT MEANS</div></div></div></div></SceneFrame>;

export const ChartScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><div style={{ position: "absolute", inset: "8% 7% 9%" }}><Label>DATA / TRAJECTORY</Label><div style={{ position: "absolute", left: 0, right: 0, top: "14%", bottom: "12%", background: "white", boxShadow: "0 26px 70px rgba(0,0,0,.13)" }}><Media beat={beat} fit="contain" /></div><div style={{ position: "absolute", left: 0, bottom: 0 }}><Statement beat={beat} /></div></div></SceneFrame>;

export const TimelineScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><div style={{ position: "absolute", inset: "8% 7% 9%" }}><Label>TIMELINE / HISTORY</Label><div style={{ position: "absolute", left: 0, right: 0, top: "20%", height: 4, background: C.line }} />{[20,40,60,80].map((x,i)=><div key={x} style={{ position: "absolute", left: `${x}%`, top: "calc(20% - 6px)", width: 16, height: 16, borderRadius: "50%", background: i === 3 ? theme.color.gold : C.ink }} />)}<div style={{ position: "absolute", left: 0, right: 0, top: "28%", height: "42%", background: "white", boxShadow: "0 26px 70px rgba(0,0,0,.12)" }}><Media beat={beat} fit="contain" /></div><div style={{ position: "absolute", left: 0, bottom: 0 }}><Statement beat={beat} /></div></div></SceneFrame>;

export const IconScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><div style={{ position: "absolute", inset: "8% 7% 9%" }}><Label>EXPLAIN</Label><div style={{ position: "absolute", left: 0, right: 0, top: "14%", height: "58%" }}><Media beat={beat} fit="contain" /></div><div style={{ position: "absolute", left: 0, bottom: 0 }}><Statement beat={beat} /></div></div></SceneFrame>;

export const PayoffScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><AbsoluteFill style={{ background: C.bg }}><Media beat={beat} fit="cover" opacity={0.28} /><AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,18,21,.28), rgba(3,18,21,.94))" }} /></AbsoluteFill><div style={{ position: "absolute", inset: "16% 8% 14%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><Label light>PAYOFF</Label><Statement beat={beat} light /><div style={{ width: 240, height: 6, background: theme.color.gold }} /></div></SceneFrame>;

export const StrictFallback: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <SceneFrame beat={beat}><AbsoluteFill style={{ background: C.paper, justifyContent: "center", alignItems: "center", padding: "8%" }}><Label>UNMAPPED MODULE: {moduleOf(beat)}</Label><div style={{ marginTop: 16, fontFamily: theme.vox.font, fontSize: 60, fontWeight: 900, lineHeight: 1, textAlign: "center" }}>{textOf(beat)}</div></AbsoluteFill></SceneFrame>;

export const LONGFORM_MODULES: Record<string, React.FC<{ beat: LongFormBeat }>> = { footage: FootageScene, evidence: EvidenceScene, archive: EvidenceScene, stat: StatScene, compare: CompareScene, chart: ChartScene, investChart: ChartScene, timeline: TimelineScene, icon: IconScene, quote: EvidenceScene, callout: EvidenceScene, payoff: PayoffScene, outro: PayoffScene, kinetic: StatScene, coinDrop: StatScene, coinStack: StatScene, jarFill: StatScene, mountain: PayoffScene };
export const DirectedScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => { const Scene = LONGFORM_MODULES[moduleOf(beat)] ?? StrictFallback; return <Scene beat={beat} />; };
