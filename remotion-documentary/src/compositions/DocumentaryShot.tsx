import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Director } from "../animations/director";

/**
 * DocumentaryShot — the demo composition. Renders a single cinematic beat
 * at 1920x1080 / 30fps / 150 frames (5s).
 *
 * Stack:
 *  - frame 0..end:    PushIn on the portrait (intensity 1.3)
 *  - frame 0..end:    vignette + grain (atmosphere, always-on)
 *  - frame 20..80:    "JOHN DOE" — OversizedNumber snaps in
 *  - frame 40..130:   dollar counter 0 → $1,000,000,000 with a gold ramp
 *  - frame 50..end:   accent line drawing under the headline
 *  - frame 90..end:   sub-label "Wall Street Journal, 2024" fades in
 *
 * Pure Director + a tiny inline accent line. No placeholders.
 */
export const DocumentaryShot: React.FC = () => {
  const AccentLine = () => {
    const frame = useCurrentFrame();
    const { width } = useVideoConfig();
    const start = 50;
    const local = Math.max(0, frame - start);
    const dur = 40;
    const t = Math.min(1, local / dur);
    const eased = t * t * (3 - 2 * t);
    const w = interpolate(eased, [0, 1], [0, width * 0.34]);
    return (
      <div
        style={{
          position: "absolute",
          top: "62%",
          left: "50%",
          transform: "translateX(-50%)",
          width: w,
          height: 2,
          background:
            "linear-gradient(90deg, rgba(253,224,71,0) 0%, #fde047 50%, rgba(253,224,71,0) 100%)",
          boxShadow: "0 0 14px rgba(253,224,71,0.6)",
          pointerEvents: "none",
          zIndex: 12,
        }}
      />
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Background — slow PushIn on the portrait */}
      <Director
        effect="pushIn"
        image="/sample-portrait.svg"
        durationInFrames={150}
        intensity={1.3}
      />

      {/* Atmosphere — always-on vignette + grain */}
      <Director effect="vignette" intensity={1.5} />
      <Director effect="grain" intensity={0.8} />

      {/* Accent line under the headline */}
      <AccentLine />

      {/* Headline — "JOHN DOE" with OversizedNumber */}
      <Sequence from={20} durationInFrames={60}>
        <Director
          effect="oversizedNumber"
          text="JOHN DOE"
          durationInFrames={60}
          delay={0}
          config={{ fontSize: 130, y: 0.5, x: 0.5 }}
        />
      </Sequence>

      {/* Counter — $0 → $1,000,000,000, gold */}
      <Sequence from={40} durationInFrames={90}>
        <Director
          effect="dollarCounter"
          durationInFrames={90}
          delay={0}
          config={{
            from: 0,
            to: 1_000_000_000,
            prefix: "$",
            fontSize: 64,
            color: "#fde047",
            x: 0.5,
            y: 0.74,
            textAlign: "center",
          }}
        />
      </Sequence>

      {/* Sub-label — fades in last */}
      <Sequence from={90} durationInFrames={50}>
        <Director
          effect="textFade"
          text="Wall Street Journal, 2024"
          durationInFrames={40}
          delay={0}
          config={{
            x: 0.5,
            y: 0.84,
            fontSize: 26,
            color: "#d4d4d8",
            fontWeight: 400,
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
