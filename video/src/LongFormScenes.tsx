import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type LongFormBeat = {
  n: number;
  name?: string;
  start?: number;
  end?: number;
  narrative?: { purpose?: string; question?: string; reveal?: string };
  visual?: { module?: string; text?: string; reveal?: string; camera?: string; footage?: string | null; asset?: string | null; assetPath?: string | null };
  typography?: { text?: string; emphasisWords?: string[] };
  footage?: string | null;
  asset?: string | null;
  assetPath?: string | null;
  render?: {
    sequence?: { index?: number; fromSeconds?: number; durationSeconds?: number };
    scene?: { kind?: string; module?: string };
    media?: { src?: string | null; fit?: string; muted?: boolean; loop?: boolean };
    typography?: { text?: string; enabled?: boolean };
    motion?: { camera?: string; revealMode?: string; internalChangeAt?: number[]; deterministic?: boolean };
    audio?: { music?: string; silence?: string; sfx?: string; jcut?: number; lcut?: number };
    transition?: string;
  };
};
const C = { bg: "#11110F", paper: "#F4F1EA", ink: "#171714", muted: "#6A675F", accent: "#D4A73C", line: "#C9C2B6" };
const textOf = (b: LongFormBeat) => b?.render?.typography?.text || b?.typography?.text || b?.visual?.reveal || b?.narrative?.reveal || b?.narrative?.question || b?.name || "";
const mediaOf = (b: LongFormBeat) => b?.render?.media?.src || b?.visual?.assetPath || b?.visual?.asset || b?.visual?.footage || b?.footage || b?.assetPath || b?.asset || "";

export const MediaLayer: React.FC<{ beat: LongFormBeat }> = ({ beat }) => {
  const media = mediaOf(beat); if (!media) return null;
  const src = String(media).replace(/^assets[\\/]/, "assets/").replace(/\\/g, "/");
  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(src);
  return isVideo ? <OffthreadVideo src={staticFile(src)} muted={beat?.render?.media?.muted ?? true} startFrom={0} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:beat?.render?.media?.fit === "contain" ? "contain" : "cover" }} /> : <Img src={staticFile(src)} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:beat?.render?.media?.fit === "contain" ? "contain" : "cover" }} />;
};
const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,.68) 100%)" }} />;

export const FootageScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const dur = Math.max(1, Number(beat?.render?.sequence?.durationSeconds ?? (Number(beat.end) - Number(beat.start))));
  const p = frame / Math.max(1, dur * fps);
  const changes = Array.isArray(beat?.render?.motion?.internalChangeAt) ? beat.render.motion.internalChangeAt.map((c: number) => c / Math.max(1, dur)) : [];
  const step = changes.filter((c: number) => p >= c).length;
  const scale = interpolate(p, [0, 1], [1.02, 1.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) + Math.min(6, step) * 0.008;
  return <AbsoluteFill style={{ background:C.bg }}><AbsoluteFill style={{ transform:`scale(${scale})`, transformOrigin:"50% 50%" }}><MediaLayer beat={beat} /></AbsoluteFill><Vignette /></AbsoluteFill>;
};

export const EvidenceScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => { const frame=useCurrentFrame(); const { fps }=useVideoConfig(); const n=textOf(beat); const revealFrames=fps*0.6; return <AbsoluteFill style={{background:C.paper,color:C.ink}}><div style={{position:"absolute",left:"7%",right:"7%",top:"13%",borderTop:`2px solid ${C.ink}`,paddingTop:18,fontFamily:"Arial",fontSize:22,letterSpacing:3,textTransform:"uppercase",color:C.muted}}>EVIDENCE</div><div style={{position:"absolute",left:"8%",right:"8%",top:"30%",fontFamily:"Arial",fontSize:Math.min(120,Math.max(52,1500/Math.max(8,n.length))),fontWeight:800,lineHeight:.95}}>{n}</div><div style={{position:"absolute",left:"8%",bottom:"12%",width:180,height:6,background:C.accent,transform:`scaleX(${Math.min(1,frame/revealFrames)})`,transformOrigin:"left"}} /></AbsoluteFill>; };
export const StatScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => { const n=textOf(beat); return <AbsoluteFill style={{background:C.paper,color:C.ink}}><div style={{position:"absolute",left:"8%",top:"12%",fontFamily:"Arial",fontSize:20,letterSpacing:4,color:C.muted}}>THE NUMBER</div><div style={{position:"absolute",left:"8%",top:"28%",width:"84%",fontFamily:"Arial",fontSize:Math.min(132,Math.max(58,1800/Math.max(10,n.length))),fontWeight:800,letterSpacing:-5,lineHeight:.95}}>{n}</div><div style={{position:"absolute",left:"8%",right:"8%",bottom:"18%",height:2,background:C.line}} /></AbsoluteFill>; };
export const CompareScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <AbsoluteFill style={{background:C.paper,color:C.ink}}><div style={{position:"absolute",left:"7%",top:"10%",fontFamily:"Arial",fontSize:18,letterSpacing:4,color:C.muted}}>CONTRADICTION</div><div style={{position:"absolute",left:"8%",top:"28%",width:"38%",fontFamily:"Arial",fontSize:72,fontWeight:700}}>{textOf(beat).split(/\s+[—–-]\s+/)[0] || textOf(beat)}</div><div style={{position:"absolute",left:"50%",top:"28%",width:"38%",paddingLeft:24,borderLeft:`2px solid ${C.ink}`,fontFamily:"Arial",fontSize:48,fontWeight:700,color:C.muted}}>WHAT IT LOOKS LIKE<br/>vs.<br/><span style={{color:C.ink}}>WHAT IT MEANS</span></div></AbsoluteFill>;
export const ChartScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => { const frame=useCurrentFrame(); const { fps }=useVideoConfig(); const bars=[.24,.42,.58,.71,.86]; const revealFrames=fps*0.6; return <AbsoluteFill style={{background:C.paper,color:C.ink}}><div style={{position:"absolute",left:"8%",top:"10%",fontFamily:"Arial",fontSize:18,letterSpacing:4,color:C.muted}}>TREND</div><div style={{position:"absolute",left:"10%",right:"10%",bottom:"17%",height:"58%",display:"flex",alignItems:"flex-end",gap:22,borderBottom:`2px solid ${C.ink}`,borderLeft:`2px solid ${C.ink}`,padding:"0 18px"}}>{bars.map((v,i)=><div key={i} style={{flex:1,height:`${v*100}%`,background:i===bars.length-1?C.accent:C.ink,transform:`scaleY(${Math.min(1,(frame-i*fps*0.33)/revealFrames)})`,transformOrigin:"bottom"}} />)}</div><div style={{position:"absolute",left:"10%",top:"21%",fontFamily:"Arial",fontSize:44,fontWeight:700,maxWidth:"78%"}}>{textOf(beat)}</div></AbsoluteFill>; };
export const TimelineScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <AbsoluteFill style={{background:C.paper,color:C.ink}}><div style={{position:"absolute",left:"8%",right:"8%",top:"45%",height:4,background:C.ink}} />{[0,1,2,3].map(i=><div key={i} style={{position:"absolute",left:`${12+i*22}%`,top:"42%",width:14,height:14,borderRadius:"50%",background:i===3?C.accent:C.ink}} />)}<div style={{position:"absolute",left:"8%",top:"20%",fontFamily:"Arial",fontSize:72,fontWeight:700}}>{textOf(beat)}</div></AbsoluteFill>;
export const IconScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <AbsoluteFill style={{background:C.paper,color:C.ink}}><div style={{position:"absolute",inset:"14% 10%",border:`2px solid ${C.ink}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Arial",fontSize:72,fontWeight:700,textAlign:"center"}}>{textOf(beat)}</div></AbsoluteFill>;
export const PayoffScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <AbsoluteFill style={{background:C.ink,color:C.paper}}><div style={{position:"absolute",left:"8%",right:"8%",top:"28%",fontFamily:"Arial",fontSize:92,fontWeight:800,lineHeight:.96}}>{textOf(beat)}</div><div style={{position:"absolute",left:"8%",bottom:"16%",width:240,height:8,background:C.accent}} /></AbsoluteFill>;
export const StrictFallback: React.FC<{ beat: LongFormBeat }> = ({ beat }) => <AbsoluteFill style={{background:C.paper,color:C.ink,justifyContent:"center",alignItems:"center",fontFamily:"Arial"}}><div style={{fontSize:56,fontWeight:700}}>UNMAPPED VISUAL MODULE</div><div style={{marginTop:18,fontSize:30,color:C.muted}}>{String(beat?.render?.scene?.module || beat?.visual?.module || "unknown")}</div></AbsoluteFill>;
export const LONGFORM_MODULES: Record<string, React.FC<{ beat: LongFormBeat }>> = { footage:FootageScene,evidence:EvidenceScene,stat:StatScene,compare:CompareScene,chart:ChartScene,investChart:ChartScene,timeline:TimelineScene,icon:IconScene,payoff:PayoffScene,kinetic:EvidenceScene,coinDrop:EvidenceScene,coinStack:EvidenceScene,jarFill:EvidenceScene,mountain:EvidenceScene };
