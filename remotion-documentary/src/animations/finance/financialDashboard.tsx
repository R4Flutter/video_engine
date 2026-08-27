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

type FinancialDashboardProps = BaseEffectProps & { config: CounterConfig };

export const financialDashboard: React.FC<FinancialDashboardProps> = ({ image, children, durationInFrames = 120, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);

  const columns = [
    { label: "Revenue", value: interpolate(t, [0, 1], [0, 2500000]), color: "#10b981" },
    { label: "Expenses", value: interpolate(t, [0, 1], [0, 1500000]), color: "#ef4444" },
    { label: "Profit", value: interpolate(t, [0, 1], [0, 1000000]), color: "#3b82f6" },
    { label: "Margin", value: interpolate(t, [0, 1], [0, 20]), color: "#f59e0b" },
  ];

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          padding: "20px",
        }}
      >
        {columns.map((col, i) => (
          <div
            key={i}
            style={{
              width: "25%",
              fontSize: 16 * intensity,
              color: col.color,
              marginBottom: "10px",
            }}
          >
            {col.label}: ${col.value.toLocaleString()}
          </div>
        ))}
      </div>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};