import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface MapRouteProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  color?: string;
  intensity?: number;
}

export const MapRoute: React.FC<MapRouteProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  start = { x: 20, y: 80 },
  end = { x: 80, y: 20 },
  color = "#00FF00",
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

  const startX = (start.x / 100) * w;
  const startY = h - ((start.y / 100) * h);
  const endX = (end.x / 100) * w;
  const endY = h - ((end.y / 100) * h);

  const dx = endX - startX;
  const dy = endY - startY;
  const cp1x = startX + dx * 0.3;
  const cp1y = startY + dy * 0.5;
  const cp2x = startX + dx * 0.7;
  const cp2y = startY + dy * 0.5;

  const path = `M${startX},${startY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;

  const totalLength = Math.sqrt(dx * dx + dy * dy) * 1.5;

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
          <path
            d={path}
            stroke={color}
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