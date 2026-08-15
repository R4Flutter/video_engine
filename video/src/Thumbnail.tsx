// The shelf thumbnail for the vox episode. Not a video frame — a poster.
//
// A Shorts thumbnail is judged at grid size, in a feed full of neon finance
// content. The paper-and-ink page is already the pattern interrupt; the job
// here is to make the claim unmissable at 200px tall: the hook at maximum
// type, one red accent, and the structure of a printed report cover — hairline
// frame, rules, a stamp. Typography only; the presenter stays in the video.
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { PaperBG } from "./vox/elements";

const vox = theme.vox;

export const Thumbnail: React.FC = () => {
  const { width, height } = useVideoConfig();
  const x = (f: number) => width * f;
  const y = (f: number) => height * f;

  return (
    <AbsoluteFill style={{ backgroundColor: vox.paper }}>
      <PaperBG />

      {/* The card frame — a hairline border like a printed cover, with a red
          corner tick so the eye has one fixed point before it hits the type. */}
      <div
        style={{
          position: "absolute",
          inset: x(0.028),
          border: `1.5px solid ${vox.ink}`,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x(0.028),
          top: x(0.028),
          width: x(0.052),
          height: x(0.052),
          borderLeft: `6px solid ${vox.accent}`,
          borderTop: `6px solid ${vox.accent}`,
        }}
      />

      {/* The claim, left-set and huge. Two lines: the hook verb phrase in ink,
          the target in the accent — the eye lands on the red word first. */}
      <div
        style={{
          position: "absolute",
          left: x(0.09),
          top: y(0.14),
          width: x(0.82),
        }}
      >
        {/* Kicker — the brand tag, small and letter-spaced, editorial rather
            than advert at grid size. */}
        <div
          style={{
            fontFamily: vox.font,
            fontWeight: 800,
            fontSize: x(0.033),
            letterSpacing: x(0.016),
            color: vox.muted,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: x(0.018),
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: x(0.024),
              height: x(0.024),
              background: vox.accent,
            }}
          />
          Real Return · Money, Explained
        </div>

        <div
          style={{
            marginTop: y(0.05),
            fontFamily: vox.font,
            fontWeight: 800,
            fontSize: x(0.126),
            lineHeight: 1.02,
            letterSpacing: -x(0.009),
            color: vox.ink,
            textTransform: "uppercase",
          }}
        >
          Your Boss
          <br />
          <span style={{ color: vox.accent }}>Doubles</span> Your Money
        </div>

        {/* The marker swipe — one red stroke under the claim, the gesture that
            says "this line is the point". */}
        <div
          style={{
            marginTop: y(0.022),
            width: x(0.72),
            height: y(0.01),
            background: vox.accent,
            opacity: 0.92,
          }}
        />

        {/* Payoff row. The stamp makes the match's return an object, not a
            word — the red circle survives grid size when the text blurs. */}
        <div
          style={{
            marginTop: y(0.06),
            display: "flex",
            alignItems: "center",
            gap: x(0.042),
          }}
        >
          <span
            style={{
              fontFamily: vox.font,
              fontWeight: 800,
              fontSize: x(0.082),
              letterSpacing: -x(0.005),
              color: vox.ink,
              textTransform: "uppercase",
            }}
          >
            Free Money
          </span>
          <div
            style={{
              width: x(0.15),
              height: x(0.15),
              borderRadius: "50%",
              background: vox.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(9deg)",
              boxShadow: `0 ${y(0.007)}px 0 rgba(26,26,26,0.16)`,
            }}
          >
            <span
              style={{
                fontFamily: vox.font,
                fontWeight: 800,
                fontSize: x(0.054),
                color: vox.paper,
                textTransform: "uppercase",
                transform: "rotate(-9deg)",
              }}
            >
              100%
            </span>
          </div>
        </div>

        {/* The ground stroke under the block — the type sits on the page like
            a headline on a spread. */}
        <div
          style={{
            marginTop: y(0.045),
            width: x(0.82),
            height: 2,
            background: vox.ink,
            opacity: 0.35,
          }}
        />
      </div>

      {/* Footer — the rule list the episode teaches, one line each, so the
          thumbnail carries the video's whole promise. */}
      <div
        style={{
          position: "absolute",
          left: x(0.09),
          bottom: y(0.07),
          width: x(0.82),
          display: "flex",
          justifyContent: "space-between",
          fontFamily: vox.font,
          fontWeight: 700,
          fontSize: x(0.042),
          letterSpacing: x(0.006),
          color: vox.muted,
          textTransform: "uppercase",
        }}
      >
        <span>401k Match</span>
        <span>$2,400 / Yr</span>
        <span>$1M at 40</span>
      </div>
    </AbsoluteFill>
  );
};
