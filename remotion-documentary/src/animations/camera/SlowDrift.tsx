import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from "remotion";
import type { BaseEffectProps } from "../../types";

/**
 * SlowDrift — continuous Lissajous-style drift. ±8px on each axis, 8s period.
 * Never settles; this is meant to be looped across an entire shot. No t clamp.
 * The "subtle camera is alive" feel.
 */
export const SlowDrift: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  delay = 0,
  intensity = 1,
  style,
  className,
  // durationInFrames is intentionally not used — drift is continuous.
  durationInFrames,
}) => {
  void durationInFrames;
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  void width;
  void height;
  const t = (frame - delay) / fps; // seconds
  const amp = 8 * intensity;
  const x = Math.sin((2 * Math.PI * t) / 8) * amp;
  const y = Math.cos((2 * Math.PI * t) / 8) * amp;

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${x}px, ${y}px)`,
          transformOrigin: "center center",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
