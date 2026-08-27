import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * GlowSubject — drop-shadow + brightness applied to the image. The glow grows
 * from 0 to ~30px as `t` runs 0→1. Color is document-yellow (#FFD400); the
 * image also gets a small brightness lift so the subject "lifts" off the page.
 */
export const GlowSubject: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 60,
  delay = 0,
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const glow = interpolate(eased, [0, 1], [0, 30 * intensity]);
  const brightness = interpolate(eased, [0, 1], [1, 1.15 * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `drop-shadow(0 0 ${glow}px rgba(255, 212, 0, 0.85)) brightness(${brightness})`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
