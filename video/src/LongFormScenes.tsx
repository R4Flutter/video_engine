// Long-form documentary scenes — MagnatesMedia-style: story assets full-bleed
// under a scrim, a living camera, kinetic display type, and per-module motion
// graphics (count-up stats, drawing charts, stamps, money particles).
import React from "react";
import { AbsoluteFill, Easing, Img, Loop, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LF } from "./longform-theme";
import { KineticText } from "./KineticText";

export type LongFormBeat = {
  n: number;
  name?: string;
  start?: number;
  end?: number;
  duration?: number;
  chapterId?: string | number;
  transition?: string;
  narrative?: { purpose?: string; question?: string; reveal?: string };
  visual?: { module?: string; text?: string; reveal?: string; camera?: string; footage?: string | null; asset?: string | null; assetPath?: string | null };
  typography?: { text?: string; emphasisWords?: string[] };
  footage?: string | null;
  asset?: string | null;
  assetPath?: string | null;
  render?: {
    sequence?: { index?: number; fromSeconds?: number; durationSeconds?: number };
    scene?: { kind?: string; module?: string };
    media?: { src?: string | null; fit?: string; muted?: boolean; loop?: boolean; list?: { src: string; at: number }[]; overlays?: { src: string; at: number; kind?: string }[] };
    typography?: { text?: string; enabled?: boolean };
    motion?: { camera?: string; revealMode?: string; internalChangeAt?: number[]; deterministic?: boolean };
    audio?: { music?: string; silence?: string; sfx?: string; jcut?: number; lcut?: number };
    transition?: string;
  };
};

const textOf = (b: LongFormBeat) => b?.render?.typography?.text || b?.typography?.text || b?.visual?.reveal || b?.narrative?.reveal || b?.narrative?.question || b?.name || "";
const mediaOf = (b: LongFormBeat) => b?.render?.media?.src || b?.visual?.assetPath || b?.visual?.asset || b?.visual?.footage || b?.footage || b?.assetPath || b?.asset || "";

/** Clip durations (seconds) measured with ffprobe, for seamless looping. */
const CLIP_DURATIONS: Record<string, number> = {
  "assets/06_BROLL/b01_empty_gym_4am.mp4": 12.96,
  "assets/06_BROLL/b02_bank_statement_scroll.mp4": 20.4,
  "assets/06_BROLL/b03_free_trial_checkout.mp4": 9.88,
  "assets/06_BROLL/b04_1990s_gym_archive.mp4": 8.618333,
  "assets/06_BROLL/b05_bally_storefront.mp4": 10.645,
  "assets/06_BROLL/b06_photoshop_box_turntable.mp4": 8.148333,
  "assets/06_BROLL/b07_2013_conference.mp4": 9.04,
  "assets/06_BROLL/b08_streaming_services_montage.mp4": 10.5105,
  "assets/06_BROLL/b09_amazon_cancel_flow.mp4": 8.32,
  "assets/06_BROLL/b10_ftc_courthouse.mp4": 8.741667,
  "assets/06_BROLL/b11_subscription_audit.mp4": 12.04,
  "assets/06_BROLL/b12_empty_gym_return.mp4": 12.96,
};

const LoopingVideo: React.FC<{ src: string; beat: LongFormBeat; style: React.CSSProperties }> = ({ src, beat, style }) => {
  const { fps } = useVideoConfig();
  const dur = Math.max(1, Number(beat?.render?.sequence?.durationSeconds ?? 4));
  const clipDur = CLIP_DURATIONS[src] ?? dur;
  const loopFrames = Math.max(1, Math.round(Math.max(clipDur, 1) * fps));
  return (
    <Loop durationInFrames={loopFrames} name={`loop-${src}`}>
      <OffthreadVideo src={staticFile(src)} muted={beat?.render?.media?.muted ?? true} style={style} />
    </Loop>
  );
};

/** Ken Burns style per the plan's declared camera intent. MagnatesMedia never
 * holds a frame: push/punch zoom in, pull zooms out, hold/settle still drift. */
const cameraTransform = (beat: LongFormBeat, frame: number, fps: number, durSeconds: number): string => {
  const cam = beat?.render?.motion?.camera || "settle";
  const dur = Math.max(1, durSeconds * fps);
  const p = Math.min(1, frame / dur);
  const inOut = Easing.inOut(Easing.cubic)(p);
  switch (cam) {
    case "push": return `scale(${1 + 0.14 * inOut})`;
    case "punch": return `scale(${1 + 0.2 * Easing.out(Easing.cubic)(p)})`;
    case "pull": return `scale(${1.14 - 0.14 * inOut})`;
    case "settle": return `scale(${1 + 0.05 * inOut}) translateX(${8 * inOut}px)`;
    case "hold":
    default: return `scale(${1.02 + 0.03 * inOut}) translateY(${-6 * inOut}px)`;
  }
};

export const MediaLayer: React.FC<{ beat: LongFormBeat; loop?: boolean }> = ({ beat }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  let media = mediaOf(beat);
  const list = beat?.render?.media?.list;
  if (list?.length) {
    const t = frame / fps;
    let cur: string | null = null;
    for (const e of list) if (t >= e.at) cur = e.src;
    if (cur) media = cur;
  }
  if (!media) return null;
  const src = String(media).replace(/^assets[\\/]/, "assets/").replace(/\\/g, "/");
  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(src);
  const fit = beat?.render?.media?.fit === "contain" ? ("contain" as const) : ("cover" as const);
  const durSeconds = Math.max(1, Number(beat?.render?.sequence?.durationSeconds ?? 4));
  const transform = cameraTransform(beat, frame, fps, durSeconds);
  const style = { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: fit, transform, transformOrigin: "50% 50%" };
  return isVideo ? <LoopingVideo src={src} beat={beat} style={style} /> : <Img src={staticFile(src)} style={style} />;
};

/** Overlay layer: brand badges (corner logos) and annotation marks (cursors,
 * highlights, circles) rendered above the scrim, timed by beat-relative `at`. */
export const Overlays: React.FC<{ beat: LongFormBeat }> = ({ beat }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const overlays = beat?.render?.media?.overlays || [];
  if (!overlays.length) return null;
  const t = frame / fps;
  const dur = Math.max(1, Number(beat?.render?.sequence?.durationSeconds ?? 4));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {overlays.map((o, i) => {
        if (t < o.at || t > o.at + Math.max(1.2, dur * 0.5)) return null;
        const p = Math.min(1, (t - o.at) / 0.35);
        const isBrand = o.kind === "brand";
        const style: React.CSSProperties = isBrand
          ? { position: "absolute", right: "6%", bottom: "8%", width: "17%", objectFit: "contain", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.55))" }
          : { position: "absolute", left: "44%", top: "58%", width: "34%", objectFit: "contain", opacity: 0.92, filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.5))" };
        return <Img key={i} src={staticFile(String(o.src).replace(/\\/g, "/"))} style={{ ...style, opacity: isBrand ? 0.95 * p : 0.92 * p }} />;
      })}
    </AbsoluteFill>
  );
};

const Scrim: React.FC<{ strong?: boolean }> = ({ strong = false }) => (
  <AbsoluteFill style={{ background: strong
    ? "linear-gradient(90deg, rgba(8,9,12,0.9) 0%, rgba(8,9,12,0.62) 45%, rgba(8,9,12,0.38) 100%)"
    : "linear-gradient(180deg, rgba(8,9,12,0.5) 0%, rgba(8,9,12,0.72) 100%)" }} />
);

const Kicker: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ position: "absolute", top: "6%", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: LF.font.display, fontWeight: 600, fontSize: 27, letterSpacing: 9, color: LF.color.gold, textTransform: "uppercase" }}>{label}</div>
  </div>
);

const Headline: React.FC<{ beat: LongFormBeat; fontSize?: number; left?: string; top?: string; width?: string }> = ({ beat, fontSize = 108, left = "8%", top = "30%", width = "80%" }) => (
  <div style={{ position: "absolute", left, top, width }}>
    <KineticText text={textOf(beat)} fontSize={fontSize} />
  </div>
);

// ------------------------------------------------------------------- footage
export const FootageScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => (
  <AbsoluteFill style={{ background: LF.color.bg }}>
    <MediaLayer beat={beat} loop />
    <Scrim strong />
    <Overlays beat={beat} />
    <Kicker label="THE STORY" />
    <Headline beat={beat} fontSize={96} />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ evidence
const Stamp: React.FC = () => {
  const frame = useCurrentFrame();
  const p = Math.min(1, frame / 18);
  const scale = interpolate(p, [0, 1], [2.6, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.8)) });
  const opacity = Math.min(1, p * 2);
  return (
    <div style={{ position: "absolute", top: "14%", right: "9%", opacity, transform: `rotate(-12deg) scale(${scale})`, border: `5px solid ${LF.color.red}`, borderRadius: 14, padding: "10px 30px" }}>
      <div style={{ fontFamily: LF.font.display, fontWeight: 700, fontSize: 44, letterSpacing: 7, color: LF.color.red }}>EVIDENCE</div>
    </div>
  );
};

export const EvidenceScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => (
  <AbsoluteFill style={{ background: LF.color.bg }}>
    <MediaLayer beat={beat} loop />
    <Scrim strong />
    <Overlays beat={beat} />
    <Kicker label="THE RECORD" />
    <Stamp />
    <Headline beat={beat} fontSize={104} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------- stat
const parseNumber = (s: string) => {
  const m = String(s || "").match(/([$~]?)([\d][\d,.]*)\s*([KMB]|THOUSAND|MILLION|BILLION)?/i);
  if (!m) return null;
  const mult = m[3] ? ({ K: 1e3, M: 1e6, B: 1e9, THOUSAND: 1e3, MILLION: 1e6, BILLION: 1e9 } as Record<string, number>)[m[3].toUpperCase()] : 1;
  return { prefix: m[1], raw: Number(m[2].replace(/,/g, "")), mult, suffix: m[3] ? m[3].toUpperCase() : "" };
};

const CountUp: React.FC<{ value: { prefix: string; raw: number; mult: number; suffix: string }; durSeconds: number; fontSize: number }> = ({ value, durSeconds, fontSize }) => {
  const frame = useCurrentFrame();
  const p = Math.min(1, frame / Math.max(1, durSeconds * 30 * 0.62));
  const eased = 1 - Math.pow(1 - p, 3.4);
  const shown = value.raw * value.mult * eased;
  const display = shown >= 1e9 ? (shown / 1e9).toFixed(1) : shown >= 1e6 ? (shown / 1e6).toFixed(1) : shown >= 1e3 ? Math.round(shown).toLocaleString() : shown.toFixed(shown < 10 ? 1 : 0);
  return (
    <div style={{ fontFamily: LF.font.black, fontWeight: 400, fontSize, lineHeight: 0.95, letterSpacing: -3, color: LF.color.gold, textShadow: "0 4px 30px rgba(212,167,60,0.35)" }}>
      {value.prefix}
      {display}
      {value.suffix ? ` ${value.suffix}` : ""}
    </div>
  );
};

export const StatScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => {
  const dur = Math.max(1, Number(beat?.render?.sequence?.durationSeconds ?? 4));
  const num = parseNumber(textOf(beat));
  return (
    <AbsoluteFill style={{ background: LF.color.bg }}>
      <MediaLayer beat={beat} loop />
      <Scrim strong />
      <Overlays beat={beat} />
      <Kicker label="THE NUMBER" />
      <div style={{ position: "absolute", left: "8%", top: "30%" }}>
        {num ? (
          <>
            <CountUp value={num} durSeconds={dur} fontSize={176} />
            <div style={{ marginTop: 14, fontFamily: LF.font.numeric, fontWeight: 700, fontSize: 40, letterSpacing: 2, color: LF.color.text }}>
              {String(textOf(beat)).replace(/^[$~]?[\d][\d,.]*\s*[KMB]?/i, "").replace(/^[^\s]+\s*/, "").trim() || beat?.narrative?.question || ""}
            </div>
          </>
        ) : (
          <Headline beat={beat} fontSize={110} />
        )}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------- compare
const VsStamp: React.FC = () => {
  const frame = useCurrentFrame();
  const p = Math.min(1, frame / 16);
  const scale = interpolate(p, [0, 1], [3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const rotate = interpolate(p, [0, 1], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: "45.5%", top: "34%", opacity: Math.min(1, p * 1.8), transform: `rotate(${rotate}deg) scale(${scale})` }}>
      <div style={{ fontFamily: LF.font.display, fontWeight: 700, fontSize: 64, letterSpacing: 2, color: LF.color.gold, border: `4px solid ${LF.color.gold}`, borderRadius: 12, padding: "6px 26px", background: "rgba(10,11,14,0.75)" }}>vs</div>
    </div>
  );
};

export const CompareScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => {
  const parts = textOf(beat).split(/\s+(?:vs\.?|→)\s+/i);
  const left = parts[0] || textOf(beat);
  const right = parts[1] || "";
  return (
    <AbsoluteFill style={{ background: LF.color.bg }}>
      <MediaLayer beat={beat} loop />
      <Scrim strong />
      <Overlays beat={beat} />
      <Kicker label="THE CONTRADICTION" />
      <div style={{ position: "absolute", left: "8%", top: "30%", width: "38%" }}>
        <KineticText text={left} fontSize={88} />
      </div>
      <VsStamp />
      {right ? (
        <div style={{ position: "absolute", left: "54%", top: "33%", width: "36%" }}>
          <KineticText text={right} fontSize={64} gold />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------- chart
const Bars: React.FC<{ beat: LongFormBeat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = Math.max(1, Number(beat?.render?.sequence?.durationSeconds ?? 4));
  const bars = [0.24, 0.42, 0.58, 0.71, 0.86];
  return (
    <div style={{ position: "absolute", left: "10%", right: "10%", bottom: "16%", height: "44%", display: "flex", alignItems: "flex-end", gap: 26, borderBottom: `3px solid ${LF.color.textDim}`, borderLeft: `3px solid ${LF.color.textDim}`, padding: "0 22px" }}>
      {bars.map((v, i) => {
        const at = (i * 0.4) / Math.max(1, dur);
        const p = Math.min(1, Math.max(0, (frame / (dur * fps) - at) / 0.55));
        const overshoot = 1 + 0.12 * Math.sin(Math.min(1, p) * Math.PI) * Math.max(0, 1 - Math.min(1, p * 3));
        const scaleY = p <= 0 ? 0 : Math.min(1, p) * overshoot;
        const last = i === bars.length - 1;
        return (
          <div key={i} style={{ flex: 1, height: `${v * 100}%`, background: last ? LF.color.gold : "#454952", transform: `scaleY(${Math.max(0, scaleY)})`, transformOrigin: "bottom", boxShadow: last ? "0 0 34px rgba(212,167,60,0.4)" : "none" }} />
        );
      })}
    </div>
  );
};

export const ChartScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => (
  <AbsoluteFill style={{ background: LF.color.bg }}>
    <MediaLayer beat={beat} loop />
    <Scrim strong />
    <Overlays beat={beat} />
    <Kicker label="THE TREND" />
    <Headline beat={beat} fontSize={92} top="24%" />
    <Bars beat={beat} />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ timeline
export const TimelineScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = Math.max(1, Number(beat?.render?.sequence?.durationSeconds ?? 4));
  const lineP = Math.min(1, frame / (dur * fps * 0.8));
  return (
    <AbsoluteFill style={{ background: LF.color.bg }}>
      <MediaLayer beat={beat} loop />
      <Scrim strong />
      <Overlays beat={beat} />
      <Kicker label="THE SEQUENCE" />
      <Headline beat={beat} fontSize={92} top="22%" />
      <div style={{ position: "absolute", left: "8%", right: "8%", top: "58%" }}>
        <div style={{ height: 4, background: LF.color.line, position: "relative", transform: `scaleX(${lineP})`, transformOrigin: "left" }} />
        {[0, 1, 2, 3].map((i) => {
          const at = (i * 0.28) / Math.max(1, dur);
          const p = Math.min(1, Math.max(0, (frame / (dur * fps) - at) / 0.3));
          const scale = interpolate(p, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.2)) });
          return <div key={i} style={{ position: "absolute", left: `${14 + i * 22}%`, top: -8, width: 20, height: 20, borderRadius: "50%", background: i === 3 ? LF.color.gold : LF.color.text, transform: `scale(${scale})`, boxShadow: i === 3 ? "0 0 22px rgba(212,167,60,0.55)" : "none" }} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------- icon
export const IconScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => (
  <AbsoluteFill style={{ background: LF.color.bg }}>
    <MediaLayer beat={beat} loop />
    <Scrim strong />
    <Overlays beat={beat} />
    <div style={{ position: "absolute", inset: "16% 11%", border: `2px solid ${LF.color.line}`, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6%" }}>
      <KineticText text={textOf(beat)} fontSize={76} align="center" />
    </div>
  </AbsoluteFill>
);

// -------------------------------------------------------------------- payoff
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const MoneyParticles: React.FC<{ seed: number; count?: number }> = ({ seed, count = 34 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rnd = mulberry32(seed);
  const parts = Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y0: -12 - rnd() * 25,
    dur: 7 + rnd() * 7,
    delay: rnd() * 6,
    size: 22 + rnd() * 26,
    sway: 20 + rnd() * 60,
    phase: rnd() * Math.PI * 2,
  }));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {parts.map((p, i) => {
        const t = (frame / fps - p.delay) / p.dur;
        if (t < 0 || t > 1) return null;
        const y = interpolate(t, [0, 1], [p.y0, 118]);
        const x = p.x + Math.sin(t * Math.PI * 2 + p.phase) * p.sway / 10;
        const rotate = Math.sin(t * Math.PI * 3 + p.phase) * 25;
        const opacity = 0.14 + 0.12 * Math.sin(t * Math.PI);
        return (
          <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: `rotate(${rotate}deg)`, opacity, fontSize: p.size, fontFamily: LF.font.display, color: LF.color.gold }}>
            $
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const PayoffScene: React.FC<{ beat: LongFormBeat }> = ({ beat }) => (
  <AbsoluteFill style={{ background: LF.color.bg }}>
    <MoneyParticles seed={beat.n * 7919} />
    <div style={{ position: "absolute", left: "10%", right: "10%", top: "34%", display: "flex", justifyContent: "center" }}>
      <KineticText text={textOf(beat)} fontSize={122} align="center" />
    </div>
    <div style={{ position: "absolute", left: "50%", bottom: "18%", width: 260, height: 8, background: LF.color.gold, transform: "translateX(-50%)", boxShadow: "0 0 26px rgba(212,167,60,0.5)" }} />
  </AbsoluteFill>
);

export const StrictFallback: React.FC<{ beat: LongFormBeat }> = ({ beat }) => (
  <AbsoluteFill style={{ background: LF.color.bg, color: LF.color.text, justifyContent: "center", alignItems: "center", fontFamily: "Arial" }}>
    <div style={{ fontSize: 56, fontWeight: 700 }}>UNMAPPED VISUAL MODULE</div>
    <div style={{ marginTop: 18, fontSize: 30, color: LF.color.textDim }}>{String(beat?.render?.scene?.module || beat?.visual?.module || "unknown")}</div>
  </AbsoluteFill>
);

export const LONGFORM_MODULES: Record<string, React.FC<{ beat: LongFormBeat }>> = {
  footage: FootageScene,
  evidence: EvidenceScene,
  stat: StatScene,
  compare: CompareScene,
  chart: ChartScene,
  investChart: ChartScene,
  timeline: TimelineScene,
  icon: IconScene,
  payoff: PayoffScene,
  kinetic: EvidenceScene,
  coinDrop: EvidenceScene,
  coinStack: EvidenceScene,
  jarFill: EvidenceScene,
  mountain: EvidenceScene,
};
