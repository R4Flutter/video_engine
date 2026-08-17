import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import director from "./director-plan.json";
import { theme } from "./theme";
import type { LongFormBeat } from "./LongFormScenes";

const OPEN_HOLD = Number(director?.coldOpen?.visualFirstSeconds ?? 3.5);
const EVIDENCE_START = Number(director?.coldOpen?.evidenceStartSeconds ?? 3.5);
const EVIDENCE_STEP = 2;
const CLAIM_MIN = Number(director?.coldOpen?.claimTargetSeconds ?? 18);

const nums = (s: string) => [...String(s || "").matchAll(/(?:\$\s?\d[\d,.]*|\b\d+(?:\.\d+)?%?|\b\d[\d,.]*(?:\s?(?:million|billion|thousand))?\b)/gi)].map(m => m[0]);

export const LongFormColdOpen: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (!enabled) return null;
  const t = frame / fps;
  const beats = director?.beats || [];
  const selected = director?.coldOpen?.selected || {};
  const evidence = beats.slice(0, 3).map((b: LongFormBeat) => ({
    text: nums(b?.narrative?.reveal || b?.visual?.text || b?.name || "")[0] || b?.visual?.text || b?.name || "",
    sub: b?.visual?.text && nums(b.visual.text).length ? String(b.visual.text).replace(nums(b.visual.text)[0], "").replace(/[|/]/g, " ").trim() : "EVIDENCE",
  })).filter(x => x.text).slice(0, 3).map((x, i) => ({ ...x, at: EVIDENCE_START + i * EVIDENCE_STEP }));
  const claim = selected.claim || "The economics are hidden in what customers do not consume.";
  const claimIn = Math.max(CLAIM_MIN, EVIDENCE_START + evidence.length * EVIDENCE_STEP);
  const claimOut = Math.min(30, claimIn + 10);
  if (t < OPEN_HOLD) return null;
  let active: (typeof evidence)[number] | undefined;
  for (let i = evidence.length - 1; i >= 0; i--) {
    if (t >= evidence[i].at && t < evidence[i].at + EVIDENCE_STEP) { active = evidence[i]; break; }
  }
  const showClaim = t >= claimIn && t <= claimOut;
  if (!active && !showClaim) return null;
  const evidenceOpacity = active ? interpolate(t, [active.at, active.at + 0.35], [0,1], { extrapolateLeft:"clamp", extrapolateRight:"clamp", easing:Easing.out(Easing.cubic) }) : 0;
  const claimOpacity = showClaim ? interpolate(t, [claimIn, claimIn+0.25, claimOut-0.4, claimOut], [0,1,1,0], { extrapolateLeft:"clamp", extrapolateRight:"clamp" }) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents:"none" }}>
      {active ? <AbsoluteFill style={{ alignItems:"center", justifyContent:"center", opacity:evidenceOpacity, padding:`0 ${width*0.1}px` }}>
        <div style={{ fontFamily:theme.font, fontWeight:900, fontSize:Math.min(150,width*0.14), lineHeight:0.9, letterSpacing:"-0.04em", color:theme.color.text, textAlign:"center" }}>{active.text}</div>
        <div style={{ marginTop:18, fontFamily:theme.font, fontWeight:800, fontSize:Math.max(28,width*0.036), letterSpacing:"0.12em", color:theme.color.gold, textAlign:"center" }}>{active.sub}</div>
      </AbsoluteFill> : null}
      {showClaim ? <AbsoluteFill style={{ alignItems:"center", justifyContent:"center", padding:`0 ${width*0.09}px`, opacity:claimOpacity }}>
        <div style={{ fontFamily:theme.font, fontWeight:900, fontSize:Math.min(102,width*0.09), lineHeight:0.95, letterSpacing:"-0.03em", color:theme.color.text, textAlign:"center", maxWidth:width*0.86 }}>
          {claim}
          <div style={{ color:theme.color.gold, marginTop:18, fontSize:0.48*Math.min(102,width*0.09) }}>WHY THIS BUSINESS MODEL WORKS</div>
        </div>
      </AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
