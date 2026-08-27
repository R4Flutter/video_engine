import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

/**
 * StaticHold — no camera motion. 15-frame fade-in only.
 * Use for "let it sit" beats, between camera moves, or for archive-still moments.
 */
export const StaticHold: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 15,
  delay = 0,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const opacity = interpolate(eased, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ ...style, opacity }} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
