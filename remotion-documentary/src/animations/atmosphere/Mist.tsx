import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

export const Mist: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;

  const mistX = ((frame * 0.05) % width) / width;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          `linear-gradient(90deg, rgba(255,255,255,${0.05 * intensity * 0.2}) 0%, transparent 50%)` +
          ` translateX(${mistX * 100}%)`,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};