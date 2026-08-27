import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

export const Fog: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;

  const fogX = ((frame * 0.1) % width) / width;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          `linear-gradient(90deg, rgba(255,255,255,${0.1 * intensity * 0.3}) 0%, rgba(255,255,255,${0.1 * intensity * 0.1}) 100%)` +
          ` translateX(${fogX * 100}%)`,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};