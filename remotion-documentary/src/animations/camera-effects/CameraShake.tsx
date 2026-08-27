import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const CameraShake: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 30, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const amplitude = 15 * intensity;
  const translateX = Math.sin(t * Math.PI * 3) * amplitude;
  const translateY = Math.cos(t * Math.PI * 3) * amplitude * 0.3;

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${translateX}px, ${translateY}px)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};