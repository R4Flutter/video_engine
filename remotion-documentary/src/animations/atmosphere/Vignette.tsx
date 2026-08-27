import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export const Vignette: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const vignetteIntensity = intensity * 0.3;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          vignetteIntensity > 0
            ? `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,${ vignetteIntensity }) 100%)`
            : "none",
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};