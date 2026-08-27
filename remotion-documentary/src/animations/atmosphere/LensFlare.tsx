import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

export const LensFlare: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;

  const flareX = ((frame * 0.5) % (width + 200)) - 100;
  const flarePosX = (flareX / width) * 100;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          `radial-gradient(circle at ${flarePosX}% 50%, rgba(255,255,200,${0.5 * intensity}), transparent 45%), radial-gradient(circle at ${flarePosX + 30}% 50%, rgba(255,200,100,${0.3 * intensity}), transparent 45%)`,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};