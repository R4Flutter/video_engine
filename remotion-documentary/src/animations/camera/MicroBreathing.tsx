import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from "remotion";
import type { BaseEffectProps } from "../../types";

/**
 * MicroBreathing — a barely-perceptible scale oscillation. ±0.005, 4s period.
 * Almost subliminal. Gives static frames a "this is alive" pulse without being motion.
 * Continuous — never settles.
 */
export const MicroBreathing: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  delay = 0,
  intensity = 1,
  style,
  className,
  // durationInFrames is intentionally not used — breathing is continuous.
  durationInFrames,
}) => {
  void durationInFrames;
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  void width;
  void height;
  const t = (frame - delay) / fps;
  const scale = 1.0 + 0.005 * intensity * Math.sin((2 * Math.PI * t) / 4);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
