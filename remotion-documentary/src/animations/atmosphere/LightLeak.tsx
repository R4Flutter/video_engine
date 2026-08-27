import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export const LightLeak: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const leakIntensity = 0.4 * intensity;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          "linear-gradient(135deg, rgba(255,100,0,${leakIntensity}), rgba(255,255,0,${leakIntensity}))",
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};