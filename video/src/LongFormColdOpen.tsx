import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { mediaUrl, resolveAsset } from "./AssetResolver";
import { theme } from "./theme";
import voice from "./voice.json";

const OPEN_HOLD = 3.5;
const EVIDENCE_START = 3.5;
const CLAIM_MIN = 18;

export const LongFormColdOpen: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (!enabled) return null;
  const t = frame / fps;
  if (t < OPEN_HOLD) return null;

  const firstBeat = voice.beats.find((b) => b.n === 1 && b.words?.length);
  const hookWord = firstBeat?.words?.find((w) => /customer|shows|ideal|problem/i.test(w.w));
  const claimIn = hookWord ? Math.max(CLAIM_MIN, hookWord.start + OPEN_HOLD) : CLAIM_MIN;
  const claimOut = Math.min(30, claimIn + 11);

  const gym = resolveAsset({ name: "empty gym 4am", visual: { module: "footage" }, narrative: { question: "capacity" } });
  const density = resolveAsset({ name: "20.8M members 2,896 clubs 7,200", visual: { module: "stat" }, typography: { text: "20.8M MEMBERS" }, narrative: { reveal: "membership density" } });
  const evidenceSrc = mediaUrl(density);
  const evidenceOpacity = interpolate(t, [EVIDENCE_START, EVIDENCE_START + .35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const claimOpacity = interpolate(t, [claimIn, claimIn + .25, claimOut - .35, claimOut], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phase = t < 5.4 ? "members" : t < 7.4 ? "clubs" : "ratio";
  const metric = phase === "members" ? "20.8M" : phase === "clubs" ? "2,896" : "7,200";
  const label = phase === "members" ? "MEMBERS" : phase === "clubs" ? "CLUBS" : "MEMBERS / CLUB";

  return <AbsoluteFill style={{ pointerEvents: "none" }}>
    {t < 10 ? <AbsoluteFill style={{ background: "rgba(3,14,16,.62)", opacity: evidenceOpacity }} /> : null}
    {t < 10 && evidenceSrc ? <div style={{ position: "absolute", left: "9%", right: "9%", top: "13%", bottom: "17%", background: "#fff", boxShadow: "0 28px 80px rgba(0,0,0,.34)", opacity: evidenceOpacity, overflow: "hidden" }}><Img src={staticFile(evidenceSrc)} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div> : null}
    {t < 10 ? <div style={{ position: "absolute", left: "8%", bottom: "10%", color: "white", opacity: evidenceOpacity }}><div style={{ fontFamily: theme.vox.font, fontSize: Math.min(120, width * .09), fontWeight: 900, lineHeight: .9, letterSpacing: "-.04em" }}>{metric}</div><div style={{ marginTop: 10, fontFamily: theme.vox.font, fontSize: 20, fontWeight: 800, letterSpacing: ".18em", color: theme.color.gold }}>{label}</div></div> : null}
    {t >= claimIn && t <= claimOut ? <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: `0 ${width * .08}px`, opacity: claimOpacity }}><div style={{ maxWidth: "84%", fontFamily: theme.vox.font, fontWeight: 900, fontSize: Math.min(90, width * .07), lineHeight: .98, letterSpacing: "-.035em", color: "white", textAlign: "center", textShadow: "0 6px 28px rgba(0,0,0,.8)" }}>THE CUSTOMER WHO NEVER SHOWS UP<div style={{ color: theme.color.gold, marginTop: 16 }}>IS NOT THE PROBLEM</div></div></AbsoluteFill> : null}
    {t >= 10 && t < claimIn ? <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "10%", color: "white", opacity: interpolate(t, [10, 10.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}><div style={{ fontFamily: theme.vox.font, fontSize: Math.min(54, width * .045), fontWeight: 800, lineHeight: 1.05 }}>A GYM ONLY WORKS BECAUSE MOST OF THE PEOPLE PAYING ARE SOMEWHERE ELSE.</div></div> : null}
    <div style={{ position: "absolute", right: "6%", top: "6%", fontFamily: theme.vox.font, fontSize: 14, letterSpacing: ".14em", color: "rgba(255,255,255,.55)" }}>THE COMPANY THAT SELLS YOU NOTHING</div>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,.48) 100%)" }} />
  </AbsoluteFill>;
};
