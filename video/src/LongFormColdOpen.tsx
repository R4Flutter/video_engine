// Cold open: owns the screen for the first beats — evidence flashes over a
// dimmed story backdrop, then the claim lands before beat 3's own text
// starts. No overlap by construction: FinanceLong suppresses the covered
// beats' visuals while this layer is active.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import director from "./director-plan.json";
import { theme } from "./theme";
import type { LongFormBeat } from "./LongFormScenes";
import { MediaLayer } from "./LongFormScenes";
import { CinematicOverlay } from "./CinematicOverlay";
import { LF } from "./longform-theme";

const OPEN_HOLD = Number(director?.coldOpen?.visualFirstSeconds ?? 3.5);
const EVIDENCE_START = Number(director?.coldOpen?.evidenceStartSeconds ?? 3.5);
const EVIDENCE_STEP = 2;

/** Second at which the cold open stops covering the beats below it. */
export const COLD_OPEN_COVER_UNTIL = (() => {
  const third = (director?.beats ?? []).find((b) => b.n === 3);
  const claimEnd = third ? Number(third.start ?? 16) - 0.2 : 15.8;
  return Math.max(OPEN_HOLD + 1, claimEnd);
})();

const nums = (s: string) => [...String(s || "").matchAll(/\$?\s?\d[\d,.]*(?:\s?(?:million|billion|thousand))?/gi)].map(m => m[0].trim());

const parseNum = (s: string) => {
  const m = String(s || "").match(/([$~]?)([\d][\d,.]*)\s*([KMB]|THOUSAND|MILLION|BILLION)?/i);
  if (!m) return null;
  const mult = m[3] ? ({ K: 1e3, M: 1e6, B: 1e9, THOUSAND: 1e3, MILLION: 1e6, BILLION: 1e9 } as Record<string, number>)[m[3].toUpperCase()] : 1;
  return { prefix: m[1], raw: Number(m[2].replace(/,/g, "")), mult, suffix: m[3] ? m[3].toUpperCase() : "" };
};

const formatNum = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(1) : n >= 1e6 ? (n / 1e6).toFixed(1) : n >= 1e3 ? Math.round(n).toLocaleString() : n.toFixed(n < 10 ? 1 : 0);

/** MagnatesMedia number-hit: counts up 0→value and slams to scale on impact. */
const NumberHit: React.FC<{ text: string; fontSize: number; color?: string }> = ({ text, fontSize, color }) => {
  const frame = useCurrentFrame();
  const num = parseNum(text);
  const p = Math.min(1, frame / (30 * 0.9));
  const eased = 1 - Math.pow(1 - p, 3.4);
  const scale = interpolate(p, [0, 0.72, 1], [1.35, 0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const show = num ? `${num.prefix}${formatNum(num.raw * num.mult * eased)}${num.suffix ? ` ${num.suffix}` : ""}` : text;
  return (
    <div style={{ fontFamily: theme.font, fontWeight: 900, fontSize, lineHeight: 0.9, letterSpacing: "-0.04em", color: color ?? theme.color.text, textAlign: "center", transform: `scale(${scale})` }}>{show}</div>
  );
};

export const LongFormColdOpen: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (!enabled) return null;
  const t = frame / fps;
  const beats = director?.beats || [];
  const selected = director?.coldOpen?.selected || {};
  const firstBeat = beats[0] as LongFormBeat | undefined;
  const evidence = beats.slice(0, 3).map((b: LongFormBeat) => ({
    text: nums(b?.narrative?.reveal || b?.visual?.text || b?.name || "")[0] || b?.visual?.text || b?.name || "",
    sub: b?.visual?.text && nums(b.visual.text).length ? String(b.visual.text).replace(nums(b.visual.text)[0], "").replace(/[|/]/g, " ").trim() : "EVIDENCE",
  })).filter(x => x.text).slice(0, 3).map((x, i) => ({ ...x, at: EVIDENCE_START + i * EVIDENCE_STEP }));
  const claim = selected.claim || "The economics are hidden in what customers do not consume.";
  const claimIn = EVIDENCE_START + evidence.length * EVIDENCE_STEP;
  const claimOut = COLD_OPEN_COVER_UNTIL;
  if (t >= claimOut) return null;
  let active: (typeof evidence)[number] | undefined;
  let activeIdx = -1;
  for (let i = evidence.length - 1; i >= 0; i--) {
    if (t >= evidence[i].at && t < evidence[i].at + EVIDENCE_STEP) { active = evidence[i]; activeIdx = i; break; }
  }
  const showClaim = t >= claimIn && t <= claimOut;
  if (!active && !showClaim && t < claimOut) return null;
  // Backdrop rotates with the evidence: beat 1 during its window and the
  // claim (callback), beats 2-3 during theirs — so their primary media is
  // actually seen even though the scenes are covered by the cold open.
  const backdropBeat = (activeIdx >= 0 ? beats[activeIdx] : firstBeat) as LongFormBeat | undefined;
  const backdrop = backdropBeat
    ? {
        ...backdropBeat,
        render: backdropBeat.render
          ? { ...backdropBeat.render, media: backdropBeat.render.media ? { ...backdropBeat.render.media, list: undefined, overlays: undefined } : undefined }
          : undefined,
      }
    : undefined;
  const evidenceOpacity = active ? interpolate(t, [active.at, active.at + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0;
  const claimOpacity = showClaim ? interpolate(t, [claimIn, claimIn + 0.25, claimOut - 0.4, claimOut], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const backdropPush = 1 + 0.08 * Math.min(1, (t - OPEN_HOLD) / (COLD_OPEN_COVER_UNTIL - OPEN_HOLD));
  return (
    <AbsoluteFill style={{ background: LF.color.bg }}>
      {backdrop ? (
        <AbsoluteFill style={{ opacity: 0.34, filter: "brightness(0.75) contrast(1.15)" }}>
          <div style={{ position: "absolute", inset: 0, transform: `scale(${backdropPush})`, transformOrigin: "50% 50%" }}>
            <MediaLayer beat={backdrop} loop />
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(8,9,12,0.35) 0%, rgba(8,9,12,0.92) 100%)" }} />
      {active ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: evidenceOpacity, padding: `0 ${width * 0.1}px`, pointerEvents: "none" }}>
          <NumberHit text={active.text} fontSize={Math.min(150, width * 0.14)} />
          <div style={{ marginTop: 18, fontFamily: theme.font, fontWeight: 800, fontSize: Math.max(28, width * 0.036), letterSpacing: "0.12em", color: theme.color.gold, textAlign: "center" }}>{active.sub}</div>
        </AbsoluteFill>
      ) : null}
      {showClaim ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: `0 ${width * 0.09}px`, opacity: claimOpacity, pointerEvents: "none" }}>
          <div style={{ fontFamily: theme.font, fontWeight: 900, fontSize: Math.min(102, width * 0.09), lineHeight: 0.95, letterSpacing: "-0.03em", color: theme.color.text, textAlign: "center", maxWidth: width * 0.86 }}>
            {claim}
            <div style={{ color: theme.color.gold, marginTop: 18, fontSize: 0.48 * Math.min(102, width * 0.09) }}>WHY THIS BUSINESS MODEL WORKS</div>
          </div>
        </AbsoluteFill>
      ) : null}
      <CinematicOverlay />
    </AbsoluteFill>
  );
};