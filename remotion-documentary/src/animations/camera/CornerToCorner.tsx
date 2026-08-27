import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * CornerToCorner — camera traverses from the top-left of the subject to the
 * bottom-right. Scale 1.0 → 1.2, while content slides so the bottom-right
 * of the source comes into frame. Default 120 frames (4s) — this is a slow move.
 */
export const CornerToCorner: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 120,
  delay = 0,
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const scale = interpolate(eased, [0, 1], [1, 1.2 * intensity]);
  // Negative translation: content slides up-left, so the bottom-right of the
  // source ends up centered at t=1.
  const tx = interpolate(eased, [0, 1], [0, -width * 0.1 * intensity]);
  const ty = interpolate(eased, [0, 1], [0, -height * 0.1 * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
