import { useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface ScribbleProps extends BaseEffectProps {
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  color?: string;
}

export const Scribble: React.FC<ScribbleProps> = ({
  start = { x: 10, y: 90 },
  end = { x: 90, y: 10 },
  color = "#0f0",
  intensity = 1,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const points = [];

  for (let i = 0; i < 20; i++) {
    const t = i / 19;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 20 * intensity;
    points.push({ x, y });
  }

  const totalLength = points.reduce((sum, p, i, arr) => {
    if (i === 0) return 0;
    const prev = arr[i - 1];
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  const t = interpolate(frame % 2000, [0, 2000], [0, 1]);
  const dashOffset = totalLength * (1 - t);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0, ...style }}
    >
      <path
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      >
        {points.map((p, i) => `${p.x},${p.y}`).join(" ")}
      </path>
    </svg>
  );
};