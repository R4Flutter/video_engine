import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeOutElastic } from "../timing/easings";

export const ChartExplosion: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 60, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutElastic(t);
  const y = interpolate(eased, [0, 1], [0, 100 * intensity]);
  const opacity = interpolate(eased, [0, 1], [1, 0]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: `${y}px`,
          width: "100%",
          height: "100px",
          background: "rgba(255,100,0,0.6)",
          opacity,
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