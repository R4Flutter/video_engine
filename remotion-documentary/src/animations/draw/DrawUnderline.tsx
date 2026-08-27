import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface DrawUnderlineProps extends BaseEffectProps {
  x?: number;
  y?: number;
  width?: number;
  color?: string;
}

export const DrawUnderline: React.FC<DrawUnderlineProps> = ({
  x = 0,
  y = 50,
  width = 100,
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const totalLength = width * 100;
  const t = interpolate(frame % 2000, [0, 2000], [0, 1]);
  const dashOffset = totalLength * (1 - t);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <line
        x1={x * 100}
        y1={y * 100}
        x2={x * 100 + width * 100}
        y2={y * 100}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};