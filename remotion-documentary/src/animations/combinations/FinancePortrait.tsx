import { AbsoluteFill, Sequence } from "remotion";
import type { CombinationProps } from "./types";
import { Director } from "../director";

/**
 * FinancePortrait — the "here is a person" shot. Stacks:
 *  1. slow PushIn on the portrait (full 150 frames)
 *  2. a faint pattern overlay (drifts +1% to add depth)
 *  3. low-intensity grain
 *  4. vignette to focus the eye on the subject
 *  5. OversizedNumber with the name, snaps in at frame 20 over 60 frames
 *  6. sublabel (title / position) fades in just after the name
 *
 * Default 150 frames. Override everything via the standard BaseEffectProps
 * (durationInFrames, intensity, style) plus `label`, `sublabel`, `image`,
 * `overlay`.
 */
export const FinancePortrait: React.FC<CombinationProps> = ({
  image = "/sample-portrait.svg",
  overlay,
  label = "JOHN DOE",
  sublabel = "Wall Street Journal, 2024",
  durationInFrames = 150,
  intensity = 1,
  style,
  className,
}) => {
  return (
    <AbsoluteFill style={style} className={className}>
      {/* 1. Background PushIn — the subject leans in toward camera */}
      <Director
        effect="pushIn"
        image={image}
        durationInFrames={durationInFrames}
        intensity={1.2 * intensity}
      />

      {/* 2. Subtle parallax overlay (faint pattern) for depth */}
      {overlay ? (
        <Director
          effect="twoLayerParallax"
          config={{ layers: [{ src: image, depth: 1.0 }, { src: overlay, depth: 1.04 }] }}
          durationInFrames={durationInFrames}
          intensity={0.6 * intensity}
        />
      ) : null}

      {/* 3. Grain — keeps the frame from looking too digital */}
      <Director effect="grain" intensity={0.6 * intensity} />

      {/* 4. Vignette — tightens focus on the subject */}
      <Director effect="vignette" intensity={1.4 * intensity} />

      {/* 5. Name — OversizedNumber with back-overshoot entrance */}
      <Sequence from={20} durationInFrames={60}>
        <Director
          effect="oversizedNumber"
          text={label}
          durationInFrames={60}
          delay={0}
          config={{ fontSize: 110, y: 0.62 }}
        />
      </Sequence>

      {/* 6. Sublabel — fades in under the name */}
      <Sequence from={70} durationInFrames={50}>
        <Director
          effect="textFade"
          text={sublabel}
          durationInFrames={40}
          delay={0}
          config={{ y: 0.74, fontSize: 28, color: "#d4d4d8", fontWeight: 400 }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
