import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeOutQuart } from "../timing/easings";

interface CounterConfig {
  from: number;
  to: number;
  durationInFrames?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
}

type BarChartGrowthProps = BaseEffectProps & { config: CounterConfig };

export const barChartGrowth: React.FC<BarChartGrowthProps> = ({ image, children, durationInFrames = 60, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const { from = 0, to = 100, prefix = "$", suffix = "", color = "#10b981" } = config;
  const value = interpolate(t, [0, 1], [from, to]);

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          width: `${value}%`,
          height: "20px",
          background: color,
          margin: "10px 0",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "0%",
          height: "20px",
          background: color,
          animation: `barGrowth 0.5s ease-out ${delay / 30}s forwards`,
        }}
      />
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};