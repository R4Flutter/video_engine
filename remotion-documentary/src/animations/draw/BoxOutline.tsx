import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface BoxOutlineProps extends BaseEffectProps {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  color?: string;
}

export const BoxOutline: React.FC<BoxOutlineProps> = ({
  x = 0,
  y = 0,
  w = 20,
  h = 20,
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const totalLength = (w + h) * 2 * 100;
  const t = interpolate(frame % 2000, [0, 2000], [0, 1]);
  const dashOffset = totalLength * (1 - t);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <rect
        x={x * 100}
        y={y * 100}
        width={w * 100}
        height={h * 100}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};