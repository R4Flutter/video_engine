import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export const Flicker: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const phase = (frame % 10) / 10;
  let opacity = 1;

  if (phase < 0.2) {
    opacity = 1;
  } else if (phase < 0.4) {
    opacity = 0.9;
  } else if (phase < 0.6) {
    opacity = 1;
  } else if (phase < 0.8) {
    opacity = 0.95;
  } else {
    opacity = 1;
  }

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        opacity: opacity * intensity,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};