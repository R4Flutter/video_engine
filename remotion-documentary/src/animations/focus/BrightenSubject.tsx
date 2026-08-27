import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * BrightenSubject — inverse of DarkenSurroundings. A white overlay visible
 * at the center, hidden at the edges. Mask: black at center (overlay
 * hidden) → transparent at 70% (overlay shown). Wait — that would darken
 * the edges. The correct mask for a white center is the inverse: mask is
 * transparent (overlay visible) at the center and black (overlay hidden) at
 * the edges.
 */
export const BrightenSubject: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const opacity = interpolate(eased, [0, 1], [0, 0.5 * intensity]);

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
          background: "white",
          WebkitMask:
            "radial-gradient(circle at center, black 0%, transparent 70%)",
          mask: "radial-gradient(circle at center, black 0%, transparent 70%)",
          opacity,
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
