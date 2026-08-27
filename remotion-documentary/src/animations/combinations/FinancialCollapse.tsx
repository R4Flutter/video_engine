import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { CombinationProps } from "./types";
import { Director } from "../director";

/**
 * FinancialCollapse — the "everything is going wrong" beat. Stacks:
 *  1. PushIn on the building
 *  2. desaturate (full → 0 over 30 frames) — drains the color out
 *  3. red warning pulse on top (eased-elastic in)
 *  4. bar chart collapse on the right (from full → 0)
 *  5. dollar counter bleeding from green to red
 *  6. a thin red divider line drawing across the screen
 *  7. grain + vignette
 *
 * Default 180 frames.
 */
export const FinancialCollapse: React.FC<CombinationProps> = ({
  image = "/sample-building.svg",
  label = "MARKET CRASH",
  data,
  durationInFrames = 180,
  intensity = 1,
  style,
  className,
}) => {
  // Inline progress divider — a thin line drawing across the screen
  const Divider = () => {
    const frame = useCurrentFrame();
    const { width } = useVideoConfig();
    const local = Math.max(0, frame - 50);
    const w = interpolate(local, [0, 40], [0, width], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: w,
          height: 2,
          background: "linear-gradient(90deg, rgba(239,68,68,0) 0%, #ef4444 50%, rgba(239,68,68,0) 100%)",
          transform: "translateY(-50%)",
          boxShadow: "0 0 12px rgba(239,68,68,0.7)",
          pointerEvents: "none",
          zIndex: 12,
        }}
      />
    );
  };

  return (
    <AbsoluteFill style={style} className={className}>
      {/* 1. PushIn on the building */}
      <Director
        effect="pushIn"
        image={image}
        durationInFrames={durationInFrames}
        intensity={1.15 * intensity}
      />

      {/* 2. Desaturate — bleed color out over the first 30 frames */}
      <Sequence from={0} durationInFrames={30}>
        <Director
          effect="desaturation"
          image={image}
          durationInFrames={30}
          delay={0}
          intensity={1.4 * intensity}
        />
      </Sequence>

      {/* 3. Red warning pulse on top */}
      <Sequence from={20} durationInFrames={60}>
        <Director
          effect="redWarningPulse"
          durationInFrames={60}
          delay={0}
          intensity={1.2 * intensity}
        />
      </Sequence>

      {/* 4. Bar chart collapse — drops from 100% to 0% width */}
      <Sequence from={30} durationInFrames={80}>
        <Director
          effect="barChartCollapse"
          durationInFrames={80}
          delay={0}
          intensity={intensity}
          config={{
            from: 100,
            to: 0,
            x: 0.06,
            y: 0.6,
            width: 0.4,
            height: 220,
            color: "#ef4444",
          }}
        />
      </Sequence>

      {/* 5. Dollar counter — animates from peak to zero */}
      <Sequence from={40} durationInFrames={80}>
        <Director
          effect="dollarCounter"
          durationInFrames={80}
          delay={0}
          intensity={intensity}
          config={{
            from: data?.from ?? 1_000_000_000,
            to: data?.to ?? 0,
            prefix: data?.prefix ?? "$",
            fontSize: 84,
            color: "#ef4444",
            x: 0.06,
            y: 0.78,
          }}
        />
      </Sequence>

      {/* 6. Red divider line */}
      <Divider />

      {/* 7. Atmosphere */}
      <Director effect="grain" intensity={0.7 * intensity} />
      <Director effect="vignette" intensity={1.5 * intensity} />

      {/* 8. Headline */}
      {label ? (
        <Sequence from={10} durationInFrames={40}>
          <Director
            effect="textFade"
            text={label}
            durationInFrames={40}
            delay={0}
            config={{
              x: 0.5,
              y: 0.12,
              fontSize: 56,
              color: "#ef4444",
              fontWeight: 800,
              textAlign: "center",
            }}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
