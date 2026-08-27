import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { CombinationProps } from "./types";
import { Director } from "../director";

/**
 * BillionDollarReveal — the "this is how much money" hero shot. Stacks:
 *  1. dark image with surroundings darkened
 *  2. slow PushIn (longer, dramatic)
 *  3. a red highlight line drawing downward
 *  4. OversizedNumber with "$1 BILLION" — delayed for impact
 *  5. dollar counter from 0 → 1,000,000,000 ramping in under the headline
 *  6. heavy vignette + grain
 *
 * Default 240 frames.
 */
export const BillionDollarReveal: React.FC<CombinationProps> = ({
  image = "/sample-building.svg",
  label = "$1 BILLION",
  data,
  durationInFrames = 240,
  intensity = 1,
  style,
  className,
  accent = "#ef4444",
}) => {
  // Red line drawing downward — a thin glowing line that grows from above
  // the headline down through the counter. Time-aligned to the headline.
  const RedLine = () => {
    const frame = useCurrentFrame();
    const { height } = useVideoConfig();
    const start = 60;
    const local = Math.max(0, frame - start);
    const dur = 50;
    const t = Math.min(1, local / dur);
    const eased = t * t * (3 - 2 * t); // smoothstep
    const lineH = interpolate(eased, [0, 1], [0, height * 0.45]);
    const opacity = interpolate(eased, [0, 0.2, 1], [0, 0.9, 0.7]);
    return (
      <div
        style={{
          position: "absolute",
          top: height * 0.18,
          left: "50%",
          width: 2,
          height: lineH,
          background: `linear-gradient(180deg, ${accent} 0%, ${accent}66 100%)`,
          transform: "translateX(-50%)",
          boxShadow: `0 0 16px ${accent}cc`,
          opacity,
          pointerEvents: "none",
          zIndex: 12,
        }}
      />
    );
  };

  const from = data?.from ?? 0;
  const to = data?.to ?? 1_000_000_000;
  const prefix = data?.prefix ?? "$";

  return (
    <AbsoluteFill style={style} className={className}>
      {/* 1. Dark image, darken surroundings to push focus to center */}
      <Director
        effect="darkenSurroundings"
        image={image}
        durationInFrames={durationInFrames}
        intensity={1.6 * intensity}
      />

      {/* 2. Slow PushIn — the building leans in */}
      <Director
        effect="pushIn"
        image={image}
        durationInFrames={durationInFrames}
        intensity={1.05 * intensity}
      />

      {/* 3. Red highlight line */}
      <RedLine />

      {/* 4. Headline — delayed for the beat of the reveal */}
      <Sequence from={60} durationInFrames={70}>
        <Director
          effect="oversizedNumber"
          text={label}
          durationInFrames={70}
          delay={0}
          config={{ fontSize: 140, y: 0.36, x: 0.5 }}
        />
      </Sequence>

      {/* 5. Dollar counter — ramps in just under the headline */}
      <Sequence from={100} durationInFrames={120}>
        <Director
          effect="dollarCounter"
          durationInFrames={120}
          delay={0}
          intensity={intensity}
          config={{
            from,
            to,
            prefix,
            fontSize: 78,
            color: "#fde047",
            x: 0.5,
            y: 0.72,
            textAlign: "center",
          }}
        />
      </Sequence>

      {/* 6. Atmosphere — heavy grain + heavy vignette */}
      <Director effect="grain" intensity={0.8 * intensity} />
      <Director effect="vignette" intensity={1.8 * intensity} />
    </AbsoluteFill>
  );
};
