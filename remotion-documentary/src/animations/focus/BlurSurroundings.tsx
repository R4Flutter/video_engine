import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * BlurSurroundings — sharp image at the center, blurred copy at the edges.
 * Implemented by overlaying a blurred clone of the image, masked so it only
 * shows in the outer ring.
 */
export const BlurSurroundings: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const opacity = interpolate(eased, [0, 1], [0, 1 * intensity]);
  const imgSrc = typeof image === "string" ? image : "";

  return (
    <AbsoluteFill style={style} className={className}>
      {/* Sharp base image */}
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Blurred overlay, masked to outer ring */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${imgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: `blur(${20 * intensity}px)`,
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
