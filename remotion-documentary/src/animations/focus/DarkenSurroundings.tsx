import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * DarkenSurroundings — black overlay visible at the edges, hidden at the
 * center. Implemented with a CSS `mask` so the overlay's radial shape
 * works regardless of underlying image content.
 *
 * Mask gradient: transparent (alpha 0) at center → black (alpha 1) at 70%.
 * Where the mask is transparent, the element is invisible; where the mask
 * is opaque, the element shows. Net effect: black at edges, image untouched
 * at the center.
 */
export const DarkenSurroundings: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const opacity = interpolate(eased, [0, 1], [0, 0.8 * intensity]);

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
          background: "black",
          WebkitMask:
            "radial-gradient(circle at center, transparent 0%, black 70%)",
          mask: "radial-gradient(circle at center, transparent 0%, black 70%)",
          opacity,
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
