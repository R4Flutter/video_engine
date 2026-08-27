import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface ArrowDrawProps extends BaseEffectProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
}

export const ArrowDraw: React.FC<ArrowDrawProps> = ({
  from,
  to,
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

  const arrowHeadSize = 8 * intensity;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
      <polygon
        points={
          `${to.x},${to.y} ` +
          `${to.x - arrowHeadSize * Math.cos(angle - 0.5)},${to.y - arrowHeadSize * Math.sin(angle - 0.5)} ` +
          `${to.x - arrowHeadSize * Math.cos(angle + 0.5)},${to.y - arrowHeadSize * Math.sin(angle + 0.5)}`
        }
        fill={color}
      />
    </svg>
  );
};