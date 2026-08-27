import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

export const LightSweep: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const sweepPos = (frame % 3000) / 3000;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          sweepPos < 0.2
            ? `linear-gradient(90deg, transparent, rgba(255,255,255,${ 0.3 * intensity }), transparent) 0% 50%`
            : sweepPos < 0.4
            ? `linear-gradient(90deg, transparent, rgba(255,255,255,${ 0.3 * intensity }), transparent) 100% 50%`
            : sweepPos < 0.6
            ? `linear-gradient(90deg, transparent, rgba(255,255,255,${ 0.3 * intensity }), transparent) 50% 0%`
            : sweepPos < 0.8
            ? `linear-gradient(90deg, transparent, rgba(255,255,255,${ 0.3 * intensity }), transparent) 50% 100%`
            : `linear-gradient(90deg, transparent, rgba(255,255,255,${ 0.3 * intensity }), transparent) 0% 50%`,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};