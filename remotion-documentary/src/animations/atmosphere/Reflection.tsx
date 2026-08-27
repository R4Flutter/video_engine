import { AbsoluteFill, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

export const Reflection: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const { height } = useVideoConfig();
  void height;

  const reflectedIntensity = 0.3 * intensity;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          `linear-gradient(
            to top,
            rgba(255,255,255,${reflectedIntensity * 0.8}) 0%,
            rgba(255,255,255,0) 100%
          )`,
        transform: "scaleY(-1)",
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};