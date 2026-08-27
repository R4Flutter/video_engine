import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeOutElastic } from "../timing/easings";

export const RedWarningPulse: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 45, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutElastic(t);
  const opacity = interpolate(eased, [0, 1], [0, 0.8 * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,0,0,0.4)",
          opacity,
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 1 - opacity * 0.5 }}
      />
      {children}
    </AbsoluteFill>
  );
};