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

type PortfolioVisualizationProps = BaseEffectProps & { config: CounterConfig };

export const portfolioVisualization: React.FC<PortfolioVisualizationProps> = ({ image, children, durationInFrames = 120, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);

  const assets = [
    { label: "Stocks", value: interpolate(t, [0, 1], [0, 500000]), color: "#3b82f6" },
    { label: "Bonds", value: interpolate(t, [0, 1], [0, 200000]), color: "#10b981" },
    { label: "Cash", value: interpolate(t, [0, 1], [0, 100000]), color: "#f59e0b" },
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
        {assets.map((asset, i) => (
          <div
            key={i}
            style={{
              width: "33%",
              fontSize: 16 * intensity,
              color: asset.color,
              marginBottom: "10px",
            }}
          >
            {asset.label}: ${asset.value.toLocaleString()}
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