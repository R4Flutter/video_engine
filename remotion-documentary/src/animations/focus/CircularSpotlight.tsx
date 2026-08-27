import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * CircularSpotlight — tighter, more focused spotlight. Smaller bright center
 * (15% radius) and a faster falloff to dark. Reads as "this exact spot".
 */
export const CircularSpotlight: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const opacity = interpolate(eased, [0, 1], [0, 0.9 * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 15%, rgba(0,0,0,0.9) 75%)",
          opacity,
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
