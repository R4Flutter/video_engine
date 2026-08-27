import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface HandDrawnCircleProps extends BaseEffectProps {
  cx?: number;
  cy?: number;
  r?: number;
  color?: string;
}

export const HandDrawnCircle: React.FC<HandDrawnCircleProps> = ({
  cx = 50,
  cy = 50,
  r = Math.min(50, 100),
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const totalLength = Math.PI * 2 * r;
  const t = interpolate(frame % 2000, [0, 2000], [0, 1]);

  const dashOffset = totalLength * (1 - t);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};