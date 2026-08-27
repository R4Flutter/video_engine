import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface MonitorChartProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  data?: Array<{ x: number; y: number }>;
  chartType?: "line" | "candlestick";
  intensity?: number;
}

export const MonitorChart: React.FC<MonitorChartProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  data,
  chartType = "line",
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

  const paddedData = data || [
    { x: 0, y: 50 }, { x: 20, y: 30 }, { x: 40, y: 70 }, { x: 60, y: 40 }, { x: 80, y: 60 }, { x: 100, y: 50 },
  ];

  const points = paddedData.map((p, i) => {
    const px = (p.x / 100) * w;
    const py = h - ((p.y / 100) * h);
    return { x: px, y: py };
  });

  const totalLength = points.reduce((sum, p, i, arr) => {
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
          background: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <svg width={w} height={h} style={{ position: "absolute", top: 0, left: 0 }}>
          {chartType === "line" && (
            <path
              d={points.map((p, i) => i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`).join("")}
              stroke="lime"
              strokeWidth={2}
              fill="none"
              strokeDasharray={totalLength}
              strokeDashoffset={totalLength - drawnLength}
              style={{ filter: `brightness(${1 + intensity * 0.2})` }}
            />
          )}
        </svg>
      </div>
      {children}
    </AbsoluteFill>
  );
};