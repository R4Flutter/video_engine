import React from "react";
import { AbsoluteFill, Img, Video, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { mediaUrl, resolveAsset } from "./AssetResolver";
import { theme } from "./theme";

/**
 * Retention contract:
 * 0–2s  contradiction + first voice
 * 2–5s  same visual subject + second meaningful confirmation
 * 5–12s widen the curiosity gap / first concrete claim
 * No blank frame, no delayed narration, no logo/title-card intro.
 */
export const LongFormColdOpen: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (!enabled) return null;

  const t = frame / fps;
  const gym = resolveAsset({
    name: "empty gym 4am",
    visual: { module: "footage" },
    narrative: { question: "capacity" },
  });
  const gymSrc = mediaUrl(gym);
  const density = resolveAsset({
    name: "20.8M members 2,896 clubs 7,200",
    visual: { module: "stat" },
    typography: { text: "20.8M MEMBERS" },
    narrative: { reveal: "membership density" },
  });
  const densitySrc = mediaUrl(density);

  const metric = t < 2.2 ? "20.8M" : t < 3.6 ? "2,896" : "7,200";
  const label = t < 2.2 ? "MEMBERS" : t < 3.6 ? "CLUBS" : "MEMBERS / CLUB";
  const metricIn = interpolate(t, [0, 0.22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const confirmation = interpolate(t, [2, 2.2, 3.45, 3.65], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ratioIn = interpolate(t, [3.55, 3.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const claimIn = interpolate(t, [4.5, 4.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const claimOut = interpolate(t, [10.8, 11.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#11110F", pointerEvents: "none" }}>
      {gymSrc ? (
        /\.(mp4|webm|mov|m4v)$/i.test(gymSrc) ? (
          <Video
            src={staticFile(gymSrc)}
            muted
            loop
            startFrom={0}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Img src={staticFile(gymSrc)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )
      ) : null}

      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.16), rgba(0,0,0,.62))" }} />

      <div style={{ position: "absolute", left: "8%", bottom: "10%", opacity: metricIn }}>
        <div style={{ fontFamily: theme.vox.font, fontSize: Math.min(132, width * 0.105), fontWeight: 900, lineHeight: 0.86, letterSpacing: "-.05em", color: "white" }}>{metric}</div>
        <div style={{ marginTop: 14, fontFamily: theme.vox.font, fontSize: Math.min(24, width * 0.020), fontWeight: 800, letterSpacing: ".16em", color: theme.color.gold }}>{label}</div>
      </div>

      {densitySrc ? (
        <div style={{ position: "absolute", right: "7%", top: "10%", width: "31%", opacity: ratioIn }}>
          <Img src={staticFile(densitySrc)} style={{ width: "100%", height: "auto", objectFit: "contain", filter: "drop-shadow(0 18px 35px rgba(0,0,0,.35))" }} />
        </div>
      ) : null}

      <div style={{ position: "absolute", left: "8%", right: "8%", top: "45%", opacity: confirmation, transform: `translateY(${(1 - confirmation) * 12}px)` }}>
        <div style={{ fontFamily: theme.vox.font, fontSize: Math.min(44, width * 0.036), fontWeight: 800, color: "white", letterSpacing: "-.02em" }}>2,896 CLUBS.</div>
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: `0 ${width * 0.10}px`, opacity: claimIn * claimOut }}>
        <div style={{ maxWidth: "82%", fontFamily: theme.vox.font, fontWeight: 900, fontSize: Math.min(90, width * 0.072), lineHeight: 0.96, letterSpacing: "-.04em", color: "white", textAlign: "center", textShadow: "0 8px 34px rgba(0,0,0,.72)" }}>
          MOST OF THE PEOPLE PAYING FOR THE GYM AREN'T THERE.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
