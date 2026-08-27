import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export const FreezeFrame: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const desat = interpolate(t, [0, 1], [0, 1]);
  const sharpen = interpolate(t, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.1)",
          filter: `brightness(${1 + desat}) saturate(0) contrast(${1 + desat * 0.5})`,
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};