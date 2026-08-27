import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

export const ExposurePulse: React.FC<BaseEffectProps> = ({ children, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const local = frame % 2000;
  const t = Math.max(0, Math.min(1, local / 1000));
  const eased = cinema(t);
  const brightness = interpolate(eased, [0, 1], [1, 1.2 * intensity]);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 10,
        ...style,
        WebkitFilter: `brightness(${brightness})`,
        filter: `brightness(${brightness})`,
      }}
      className={className}
    >
      {children}
    </AbsoluteFill>
  );
};