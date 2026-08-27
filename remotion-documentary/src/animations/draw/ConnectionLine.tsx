import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface ConnectionLineProps extends BaseEffectProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  curve?: number;
  color?: string;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  curve = 0.3,
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const totalLength = Math.sqrt(
    (to.x - from.x) ** 2 + (to.y - from.y) ** 2
  );
  const t = interpolate(frame % 2000, [0, 2000], [0, 1]);
  const dashOffset = totalLength * (1 - t);

  const cpX = from.x + (to.x - from.x) * curve;
  const cpY = from.y + (to.y - from.y) * curve;

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <path
        d={`M${from.x},${from.y} C${cpX},${cpY} ${to.x},${to.y}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};