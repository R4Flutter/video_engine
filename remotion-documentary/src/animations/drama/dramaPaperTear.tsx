import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export const dramaPaperTear: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 40, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const tearY = interpolate(t, [0, 1], [0, 100 * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: `${tearY}px`,
          width: "100%",
          height: "50px",
          background: "rgba(255,255,255,0.3)",
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