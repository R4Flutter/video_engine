import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * FocusPull — `filter: blur` animates from 8px → 0px. The image starts out
 * of focus and "pulls" into sharpness, like a camera's autofocus landing.
 */
export const FocusPull: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 45,
  delay = 0,
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const blur = interpolate(eased, [0, 1], [8 * intensity, 0]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `blur(${blur}px)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
