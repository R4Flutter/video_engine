import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

export const ShadowMovement: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;

  const shadowX = (frame % width) / width;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        background:
          shadowX < 0.5
            ? `linear-gradient(90deg, rgba(0,0,0,${0.5 * intensity}) 0%, transparent 50%)`
            : `linear-gradient(270deg, rgba(0,0,0,${0.5 * intensity}) 0%, transparent 50%)`,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};