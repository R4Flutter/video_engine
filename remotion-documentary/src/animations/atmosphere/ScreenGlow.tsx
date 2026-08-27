import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export const ScreenGlow: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const glowIntensity = 0.2 * intensity;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          `radial-gradient(circle at 30% 30%, rgba(255,255,255,${glowIntensity * 0.5}), transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,255,255,${glowIntensity * 0.3}), transparent 50%)`,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};