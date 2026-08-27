import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const ScreenGlitch: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const offset = Math.floor(t * 10) * intensity;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          inset: 0,
          filter: `hue-rotate(${t * 30}deg)`,
          transform: `translate(${offset}px, ${offset / 2}px)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};