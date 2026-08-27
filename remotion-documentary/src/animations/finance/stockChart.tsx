import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeOutQuart } from "../timing/easings";

interface ChartConfig {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  bgColor?: string;
}

type StockChartProps = BaseEffectProps & { config: ChartConfig };

export const stockChart: React.FC<StockChartProps> = ({ image, children, durationInFrames = 120, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const { data, color = "#3b82f6", bgColor = "transparent" } = config;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = interpolate(val, [Math.min(...data), Math.max(...data)], [100, 0]);
    return { x, y: y * intensity };
  });

  return (
    <AbsoluteFill style={style} className={className}>
      <svg width="100%" height="100%">
        <path
          fill={bgColor}
          stroke={color}
          strokeWidth={2}
          d={points
            .map((p, i) => i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)
            .join(" ")}
        />
      </svg>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};