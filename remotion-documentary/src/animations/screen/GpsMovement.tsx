import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface GpsMovementProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  path?: Array<{ x: number; y: number }>;
  intensity?: number;
}

export const GpsMovement: React.FC<GpsMovementProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  path: pathPoints = [
    { x: 10, y: 90 }, { x: 30, y: 50 }, { x: 50, y: 80 }, { x: 70, y: 30 }, { x: 90, y: 70 },
  ],
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

  const paddedPoints = pathPoints.map(p => ({
    x: (p.x / 100) * w,
    y: h - ((p.y / 100) * h),
  }));

  const totalLength = paddedPoints.reduce((sum, p, i, arr) => {
    if (i === 0) return 0;
    const prev = arr[i - 1];
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  const frame = useCurrentFrame();
  const progress = (frame % 2000) / 2000;
  const drawnLength = progress * totalLength;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top}%`,
          width: `${w}%`,
          height: `${h}%`,
          overflow: "hidden",
          background: "rgba(0, 0, 0, 0.6)",
        }}
      >
        <svg width={w} height={h} style={{ position: "absolute", top: 0, left: 0 }}>
          {paddedPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3 * intensity}
              fill={i === 0 ? "#0f0" : "#ff0"}
            />
          ))}
          <path
            d={paddedPoints.map((p, i) => i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`).join("")}
            stroke="#0f0"
            strokeWidth={2}
            fill="none"
            strokeDasharray={totalLength}
            strokeDashoffset={totalLength - drawnLength}
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};