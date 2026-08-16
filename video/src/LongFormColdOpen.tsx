import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import voice from "./voice.json";

const OPEN_HOLD = 3.5;
const EVIDENCE_START = 3.5;
const EVIDENCE_STEP = 2;
const CLAIM_MIN = 18;

const isCompanySellsNothing = () =>
  /company\s+that\s+sells\s+you\s+nothing/i.test(
    typeof document !== "undefined" ? document.title : "",
  );

const firstBeatVoice = () => voice.beats.find((b) => b.n === 1 && b.words.length > 0);

/**
 * Long-form finance cold open:
 * 0–3.5s   visual contradiction only; no text, no voice, no logo.
 * 3.5–9.5s evidence ladder; one number at a time.
 * 18s+     interpretive hook claim; one designed claim, not a title card.
 *
 * This is intentionally renderer-level: the existing FrameZeroCard is a
 * Shorts treatment and must not run during a long-form documentary opener.
 */
export const LongFormColdOpen: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (!enabled) return null;

  const t = frame / fps;
  const evidence = [
    { at: EVIDENCE_START, text: "20.8M", sub: "MEMBERS" },
    { at: EVIDENCE_START + EVIDENCE_STEP, text: "2,896", sub: "CLUBS" },
    { at: EVIDENCE_START + EVIDENCE_STEP * 2, text: "7,200", sub: "MEMBERS / CLUB" },
  ];

  const voiceWords = firstBeatVoice()?.words ?? [];
  const hookStartWord = voiceWords.find((w) => /customer|shows|ideal|problem/i.test(w.w));
  const spokenHookAt = hookStartWord ? Math.max(CLAIM_MIN, hookStartWord.start + 3.5) : CLAIM_MIN;
  const claimIn = spokenHookAt;
  const claimOut = Math.min(voiceWords.length ? 30 : 30, claimIn + 12);

  if (t < OPEN_HOLD) return null;

  const activeEvidence = evidence.findLast((x) => t >= x.at && t < x.at + EVIDENCE_STEP);
  const showClaim = t >= claimIn && t <= claimOut;

  if (!activeEvidence && !showClaim) return null;

  const fade = interpolate(t, [activeEvidence?.at ?? claimIn, (activeEvidence?.at ?? claimIn) + 0.35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const claimOpacity = showClaim
    ? interpolate(t, [claimIn, claimIn + 0.25, claimOut - 0.4, claimOut], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {activeEvidence ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: fade,
            padding: `0 ${width * 0.1}px`,
          }}
        >
          <div
            style={{
              fontFamily: theme.font,
              fontWeight: 900,
              fontSize: Math.min(150, width * 0.14),
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              color: theme.color.text,
              textAlign: "center",
            }}
          >
            {activeEvidence.text}
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: theme.font,
              fontWeight: 800,
              fontSize: Math.max(28, width * 0.036),
              letterSpacing: "0.12em",
              color: theme.color.gold,
              textAlign: "center",
            }}
          >
            {activeEvidence.sub}
          </div>
        </AbsoluteFill>
      ) : null}

      {showClaim ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: `0 ${width * 0.09}px`,
            opacity: claimOpacity,
          }}
        >
          <div
            style={{
              fontFamily: theme.font,
              fontWeight: 900,
              fontSize: Math.min(102, width * 0.09),
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              color: theme.color.text,
              textAlign: "center",
              maxWidth: width * 0.86,
            }}
          >
            THE CUSTOMER WHO NEVER SHOWS UP
            <div style={{ color: theme.color.gold, marginTop: 18 }}>IS NOT THE PROBLEM</div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
