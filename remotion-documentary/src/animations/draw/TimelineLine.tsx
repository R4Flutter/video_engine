import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface TimelineLineProps extends BaseEffectProps {
  x?: number;
  y?: number;
  length?: number;
  color?: string;
}

export const TimelineLine: React.FC<TimelineLineProps> = ({
  x = 50,
  y = 50,
  length = 80,
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const totalLength = length * 100;
  const t = interpolate(frame % 2000, [0, 2000], [0, 1]);
  const dashOffset = totalLength * (1 - t);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <line
        x1={(x - length / 2) * 100}
        y1={y * 100}
        x2={(x + length / 2) * 100}
        y2={y * 100}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
      <circle
        cx={(x - length / 2) * 100}
        cy={y * 100}
        r={5 * intensity}
        fill={color}
      />
      <circle
        cx={(x + length / 2) * 100}
        cy={y * 100}
        r={5 * intensity}
        fill={color}
      />
    </svg>
  );
};