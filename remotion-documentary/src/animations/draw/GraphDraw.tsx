import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface GraphDrawProps extends BaseEffectProps {
  points: Array<{ x: number; y: number }>;
  color?: string;
}

export const GraphDraw: React.FC<GraphDrawProps> = ({
  points,
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const totalLength = points
    .slice(1)
    .reduce((sum, p, i, arr) => {
      const prev = arr[i - 1] || points[0];
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0);

  const t = interpolate(frame % 2000, [0, 2000], [0, 1]);
  const dashOffset = totalLength * (1 - t);

  const pathPoints = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <polyline
        points={pathPoints}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};