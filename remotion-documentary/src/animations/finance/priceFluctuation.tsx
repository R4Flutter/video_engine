import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { easeInOutExpo } from "../timing/easings";

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

type PriceFluctuationProps = BaseEffectProps & { config: CounterConfig };

export const priceFluctuation: React.FC<PriceFluctuationProps> = ({ image, children, durationInFrames = 45, delay = 0, intensity = 1, style, className, config }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = easeInOutExpo(t);
  const { from = -20, to = 20, prefix = "", suffix = "%", fontSize = 24, color = "#f97316" } = config;
  const value = interpolate(t, [0, 1], [from, to]);

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
        {value > 0 ? `▲${value}${suffix}` : `▼${Math.abs(value)}${suffix}`}
      </div>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </AbsoluteFill>
  );
};