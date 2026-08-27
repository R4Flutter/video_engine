import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeInOutQuart } from "../timing/easings";

export const Orbit: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 60, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeInOutQuart(t);
  const angle = interpolate(eased, [0, 1], [0, Math.PI * 2 * intensity]);
  const radius = 100 * intensity;
  const translateX = Math.sin(angle) * radius;
  const translateY = Math.cos(angle) * radius;

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