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

type MarketCapCounterProps = BaseEffectProps & { config: CounterConfig };

export const marketCapCounter: React.FC<MarketCapCounterProps> = ({ image, children, durationInFrames = 60, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeOutQuart(t);
  const { from = 0, to = 10000000000, prefix = "$", suffix = "M", decimals = 1, fontSize = 24, color = "#8b5cf6" } = config;
  const value = interpolate(t, [0, 1], [from, to]);
  const formatted = `${prefix}${value.toFixed(decimals)}${suffix}`;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: fontSize * intensity,
          color,
        }}
      >
        {formatted}
      </div>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};